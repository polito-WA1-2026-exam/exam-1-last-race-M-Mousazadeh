'use strict';

const db = require('../db');

/**
 * Get all stations
 */
function getStations() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM stations ORDER BY id';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Get all line station associations ordered by line and position
 */
function getAllLineStations() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT line_id, station_id, position FROM line_stations ORDER BY line_id, position';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Get lines with ordered station IDs
 */
function getLinesWithStations() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT l.id AS lineId, l.name, l.color, ls.station_id AS stationId, ls.position
      FROM lines l
      JOIN line_stations ls ON l.id = ls.line_id
      ORDER BY l.id, ls.position
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Group by lineId to match response shape
      const linesMap = {};
      for (const row of rows) {
        if (!linesMap[row.lineId]) {
          linesMap[row.lineId] = {
            id: row.lineId,
            name: row.name,
            color: row.color,
            stationIds: []
          };
        }
        linesMap[row.lineId].stationIds.push(row.stationId);
      }
      resolve(Object.values(linesMap));
    });
  });
}

/**
 * Get all events
 */
function getEvents() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM events';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Get a single random event
 */
function getRandomEvent() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM events ORDER BY RANDOM() LIMIT 1';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  getStations,
  getAllLineStations,
  getLinesWithStations,
  getEvents,
  getRandomEvent
};
