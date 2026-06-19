'use strict';

const networkDao = require('../dao/network-dao');
const gameDao = require('../dao/game-dao');
const db = require('../db');

/**
 * Builds the graph representation of the metro network dynamically from the database.
 */
async function getNetworkGraph() {
  const lineStations = await networkDao.getAllLineStations();
  const stations = await networkDao.getStations();
  
  // Group stations by line
  const linesMap = {};
  for (const ls of lineStations) {
    if (!linesMap[ls.line_id]) {
      linesMap[ls.line_id] = [];
    }
    linesMap[ls.line_id].push(ls);
  }
  
  // Sort stations on each line by position
  for (const lineId in linesMap) {
    linesMap[lineId].sort((a, b) => a.position - b.position);
  }

  const adjacency = new Map(); // stationId -> Set<stationId>
  const segmentLines = new Map(); // canonicalKey -> Set<lineId>
  const stationLines = new Map(); // stationId -> Set<lineId>

  const addAdjacency = (u, v) => {
    if (!adjacency.has(u)) adjacency.set(u, new Set());
    if (!adjacency.has(v)) adjacency.set(v, new Set());
    adjacency.get(u).add(v);
    adjacency.get(v).add(u);
  };

  const getCanonicalKey = (a, b) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `${min}-${max}`;
  };

  for (const lineIdStr in linesMap) {
    const lineId = parseInt(lineIdStr, 10);
    const list = linesMap[lineId];
    
    // Store line ownership for each station
    for (const ls of list) {
      if (!stationLines.has(ls.station_id)) {
        stationLines.set(ls.station_id, new Set());
      }
      stationLines.get(ls.station_id).add(lineId);
    }

    // Build segments
    for (let i = 0; i < list.length - 1; i++) {
      const u = list[i].station_id;
      const v = list[i + 1].station_id;
      addAdjacency(u, v);
      
      const key = getCanonicalKey(u, v);
      if (!segmentLines.has(key)) {
        segmentLines.set(key, new Set());
      }
      segmentLines.get(key).add(lineId);
    }
  }

  // Identify interchange stations (appearing in >1 distinct line)
  const interchanges = new Set();
  for (const [stationId, linesSet] of stationLines.entries()) {
    if (linesSet.size > 1) {
      interchanges.add(stationId);
    }
  }

  // Create lookup for station info by id
  const stationLookup = new Map();
  for (const s of stations) {
    stationLookup.set(s.id, s);
  }

  return { adjacency, segmentLines, stationLines, interchanges, stationLookup };
}

/**
 * Assigns a start and destination station at least 3 segments apart using BFS.
 */
async function assignStartAndDest() {
  const { adjacency, stationLookup } = await getNetworkGraph();
  const stations = Array.from(stationLookup.values());
  if (stations.length === 0) {
    throw new Error('No stations in database');
  }

  let attempts = 0;
  while (attempts < 100) {
    const startStation = stations[Math.floor(Math.random() * stations.length)];
    const startId = startStation.id;

    // Breadth-First Search to calculate segment distances
    const dist = new Map();
    const queue = [startId];
    dist.set(startId, 0);

    while (queue.length > 0) {
      const u = queue.shift();
      const currentDist = dist.get(u);
      const neighbors = adjacency.get(u) || new Set();
      for (const v of neighbors) {
        if (!dist.has(v)) {
          dist.set(v, currentDist + 1);
          queue.push(v);
        }
      }
    }

    // Find candidates at distance >= 3
    const candidates = [];
    for (const [stationId, d] of dist.entries()) {
      if (d >= 3) {
        candidates.push(stationId);
      }
    }

    if (candidates.length > 0) {
      const destId = candidates[Math.floor(Math.random() * candidates.length)];
      const destStation = stationLookup.get(destId);
      return { start: startStation, destination: destStation };
    }
    attempts++;
  }
  throw new Error('Could not find a valid start and destination pair with distance >= 3');
}

/**
 * Validate a route sequence submitted by the client.
 */
async function validateRoute(game, selectedSegments) {
  if (!selectedSegments || selectedSegments.length === 0) {
    return { valid: false, reason: 'Route is empty' };
  }

  const { segmentLines, interchanges } = await getNetworkGraph();
  const startId = game.start_station_id;
  const destId = game.dest_station_id;

  // 1. Check for duplicate segments (canonical representation)
  const seen = new Set();
  for (const key of selectedSegments) {
    const parts = key.split('-').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      return { valid: false, reason: `Malformed segment key: ${key}` };
    }
    const min = Math.min(parts[0], parts[1]);
    const max = Math.max(parts[0], parts[1]);
    const canonical = `${min}-${max}`;
    if (seen.has(canonical)) {
      return { valid: false, reason: `Duplicate segment used: ${canonical}` };
    }
    seen.add(canonical);
  }

  // 2. Track connection from start
  let current = startId;
  const segmentList = [];

  for (let i = 0; i < selectedSegments.length; i++) {
    const key = selectedSegments[i];
    const parts = key.split('-').map(Number);
    const u = parts[0];
    const v = parts[1];
    const canonical = `${Math.min(u, v)}-${Math.max(u, v)}`;

    const lines = segmentLines.get(canonical);
    if (!lines) {
      return { valid: false, reason: `Segment ${key} does not exist in network` };
    }

    let nextStation;
    if (u === current) {
      nextStation = v;
    } else if (v === current) {
      nextStation = u;
    } else {
      return { valid: false, reason: `Segment ${key} is not connected to current station ${current}` };
    }

    segmentList.push({ u, v, key: canonical, lines, junctionBefore: i > 0 ? current : null });
    current = nextStation;
  }

  // Destination check
  if (current !== destId) {
    return { valid: false, reason: `Route does not reach the destination (ended at ${current}, expected ${destId})` };
  }

  // 3. Line-change rule check
  for (let i = 0; i < segmentList.length - 1; i++) {
    const seg1 = segmentList[i];
    const seg2 = segmentList[i + 1];
    const junction = seg2.junctionBefore;

    // Check if the two consecutive segments share at least one line
    const commonLines = [...seg1.lines].filter(lineId => seg2.lines.has(lineId));
    if (commonLines.length === 0) {
      // Line change! Junction must be an interchange station
      if (!interchanges.has(junction)) {
        return { valid: false, reason: `Line change at station ${junction} is invalid because it is not an interchange station` };
      }
    }
  }

  return { valid: true };
}

/**
 * Execute game execution phase: checks validity, picks random events, updates coins, and marks database row.
 */
async function executeGame(gameId, userId, selectedSegments) {
  const game = await gameDao.getGameById(gameId);
  if (!game) {
    return { status: 404, error: 'Game not found' };
  }
  if (game.user_id !== userId) {
    return { status: 403, error: 'Forbidden' };
  }
  if (game.status !== 'planning') {
    return { status: 400, error: 'Game is not in planning phase' };
  }

  // Validate route
  const validation = await validateRoute(game, selectedSegments);
  if (!validation.valid) {
    await gameDao.finishGame(gameId, 'invalid', 0);
    return {
      status: 200,
      result: {
        valid: false,
        reason: validation.reason,
        finalScore: 0
      }
    };
  }

  // Run execution steps
  const { stationLookup } = await getNetworkGraph();
  const allEvents = await networkDao.getEvents();
  
  let coins = 20;
  const steps = [];
  let currentStationId = game.start_station_id;

  for (const key of selectedSegments) {
    const parts = key.split('-').map(Number);
    const u = parts[0];
    const v = parts[1];
    const nextStationId = (u === currentStationId) ? v : u;

    // Select random event
    const event = allEvents[Math.floor(Math.random() * allEvents.length)];
    coins += event.effect;

    steps.push({
      from: { id: currentStationId, name: stationLookup.get(currentStationId).name },
      to: { id: nextStationId, name: stationLookup.get(nextStationId).name },
      event: { description: event.description, effect: event.effect },
      coins: coins
    });

    currentStationId = nextStationId;
  }

  const finalScore = Math.max(0, coins);
  await gameDao.finishGame(gameId, 'completed', finalScore);

  return {
    status: 200,
    result: {
      valid: true,
      steps,
      finalScore
    }
  };
}

module.exports = {
  getNetworkGraph,
  assignStartAndDest,
  validateRoute,
  executeGame
};
