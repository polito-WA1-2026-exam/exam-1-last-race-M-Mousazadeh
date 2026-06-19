'use strict';

const db = require('../db');

/**
 * Create a new game in the 'planning' state
 */
function createGame(userId, startStationId, destStationId) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO games (user_id, start_station_id, dest_station_id, status, score, created_at)
      VALUES (?, ?, ?, 'planning', NULL, ?)
    `;
    const createdAt = new Date().toISOString();
    db.run(sql, [userId, startStationId, destStationId, createdAt], function (err) {
      if (err) {
        reject(err);
      } else {
        // Resolve with the newly created game ID
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Get game details by ID
 */
function getGameById(gameId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM games WHERE id = ?';
    db.get(sql, [gameId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Update the game status and score when it finishes
 */
function finishGame(gameId, status, score) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE games SET status = ?, score = ? WHERE id = ?';
    db.run(sql, [status, score, gameId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Retrieve high score rankings for all users with at least one completed game
 */
function getRanking() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT u.username, u.name, MAX(g.score) AS bestScore
      FROM users u
      JOIN games g ON g.user_id = u.id
      WHERE g.score IS NOT NULL AND g.status = 'completed'
      GROUP BY u.id
      ORDER BY bestScore DESC, u.username ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  createGame,
  getGameById,
  finishGame,
  getRanking
};
