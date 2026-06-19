'use strict';

const db = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return { salt, hash };
}

db.serialize(() => {
  console.log('Seeding the database...');

  db.run('DROP TABLE IF EXISTS games');
  db.run('DROP TABLE IF EXISTS line_stations');
  db.run('DROP TABLE IF EXISTS events');
  db.run('DROP TABLE IF EXISTS lines');
  db.run('DROP TABLE IF EXISTS stations');
  db.run('DROP TABLE IF EXISTS users');
  db.run(`
    CREATE TABLE users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT NOT NULL UNIQUE,
      name      TEXT NOT NULL,
      salt      TEXT NOT NULL,
      hash      TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE stations (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT NOT NULL UNIQUE,
      x     INTEGER NOT NULL,
      y     INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE lines (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT NOT NULL UNIQUE,
      color  TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE line_stations (
      line_id     INTEGER NOT NULL,
      station_id  INTEGER NOT NULL,
      position    INTEGER NOT NULL,
      PRIMARY KEY (line_id, station_id),
      FOREIGN KEY (line_id)    REFERENCES lines(id),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    )
  `);

  db.run(`
    CREATE TABLE events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      description  TEXT NOT NULL,
      effect       INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE games (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL,
      start_station_id  INTEGER NOT NULL,
      dest_station_id   INTEGER NOT NULL,
      status            TEXT NOT NULL,
      score             INTEGER,
      created_at        TEXT NOT NULL,
      FOREIGN KEY (user_id)          REFERENCES users(id),
      FOREIGN KEY (start_station_id) REFERENCES stations(id),
      FOREIGN KEY (dest_station_id)  REFERENCES stations(id)
    )
  `);

  // changing users to milan metro players
  const userStmt = db.prepare('INSERT INTO users (id, username, name, salt, hash) VALUES (?, ?, ?, ?, ?)');
  const users = [
    { id: 1, username: 'mohammadreza', name: 'Mohammadreza', password: '123456' },
    { id: 2, username: 'marco', name: 'Marco', password: 'pwd-marco-456' },
    { id: 3, username: 'giulia', name: 'Giulia', password: 'pwd-giulia-789' }
  ];
  for (const u of users) {
    const { salt, hash } = hashPassword(u.password);
    userStmt.run(u.id, u.username, u.name, salt, hash);
  }
  userStmt.finalize();

  // changing stations to milan metro stops
  const stationStmt = db.prepare('INSERT INTO stations (id, name, x, y) VALUES (?, ?, ?, ?)');
  const stations = [
    [1, 'Duomo', 430, 280],
    [2, 'Cadorna', 310, 240],
    [3, 'Loreto', 580, 200],
    [4, 'Centrale', 520, 150],
    [5, 'Garibaldi', 450, 170],
    [6, 'Porta Romana', 480, 400],
    [7, 'Lotto', 220, 200],
    [8, 'San Babila', 520, 280],
    [9, 'Moscova', 420, 170],
    [10, 'Porta Genova', 320, 380],
    [11, 'Lambrate', 700, 200],
    [12, 'Sesto M.no', 750, 120],
    [13, 'Rho Fiera', 110, 150],
    [14, 'San Donato', 680, 420]
  ];
  for (const s of stations) {
    stationStmt.run(s[0], s[1], s[2], s[3]);
  }
  stationStmt.finalize();

  // changing lines to milan metro lines
  const lineStmt = db.prepare('INSERT INTO lines (id, name, color) VALUES (?, ?, ?)');
  const lines = [
    [1, 'M1', '#e4002b'],
    [2, 'M2', '#00a650'],
    [3, 'M3', '#f5a623'],
    [4, 'M4', '#0078d4']
  ];
  for (const l of lines) {
    lineStmt.run(l[0], l[1], l[2]);
  }
  lineStmt.finalize();

  // changing line routes to follow milan metro paths
  const lineStationStmt = db.prepare('INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)');
  
  // M1 Red: Rho Fiera - Lotto - Cadorna - Duomo - San Babila - Loreto - Sesto M.no
  const m1Stations = [13, 7, 2, 1, 8, 3, 12];
  m1Stations.forEach((stationId, pos) => {
    lineStationStmt.run(1, stationId, pos);
  });

  // M2 Green: Cadorna - Garibaldi - Centrale - Loreto - Lambrate
  const m2Stations = [2, 5, 4, 3, 11];
  m2Stations.forEach((stationId, pos) => {
    lineStationStmt.run(2, stationId, pos);
  });

  // M3 Yellow: Duomo - Moscova - Garibaldi - Centrale
  const m3Stations = [1, 9, 5, 4];
  m3Stations.forEach((stationId, pos) => {
    lineStationStmt.run(3, stationId, pos);
  });

  // M4 Blue: San Babila - Duomo - Porta Genova - Porta Romana - San Donato
  const m4Stations = [8, 1, 10, 6, 14];
  m4Stations.forEach((stationId, pos) => {
    lineStationStmt.run(4, stationId, pos);
  });

  lineStationStmt.finalize();

  const eventStmt = db.prepare('INSERT INTO events (id, description, effect) VALUES (?, ?, ?)');
  const events = [
    [1, 'Quiet journey, nothing happens', 0],
    [2, 'Wrong platform, backtrack', -2],
    [3, 'Kind passenger gives you a coin', 1],
    [4, 'You find a forgotten wallet', 3],
    [5, 'Ticket inspector fines you', -3],
    [6, 'A busker tips you for singing along', 2],
    [7, 'Signal failure causes a short delay', -1],
    [8, 'Empty carriage, a smooth ride', 1],
    [9, 'Pickpocket on a crowded train', -4],
    [10, 'You win a station lottery kiosk prize', 4]
  ];
  for (const e of events) {
    eventStmt.run(e[0], e[1], e[2]);
  }
  eventStmt.finalize();

  // changing past games to use new station ids
  const gameStmt = db.prepare('INSERT INTO games (user_id, start_station_id, dest_station_id, status, score, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const pastGames = [
    [1, 13, 12, 'completed', 23, '2026-06-01T12:00:00.000Z'],
    [1, 6, 7, 'completed', 11, '2026-06-02T13:00:00.000Z'],
    [1, 1, 11, 'completed', 18, '2026-06-03T14:00:00.000Z'],
    [2, 13, 14, 'completed', 15, '2026-06-01T15:00:00.000Z'],
    [2, 4, 10, 'completed', 9, '2026-06-02T16:00:00.000Z']
  ];
  for (const g of pastGames) {
    gameStmt.run(g[0], g[1], g[2], g[3], g[4], g[5]);
  }
  gameStmt.finalize();

  console.log('Seeding completed successfully!');
});
