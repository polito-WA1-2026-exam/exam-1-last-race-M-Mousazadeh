'use strict';

const db = require('../db');
const crypto = require('crypto');

/**
 * Get a user by username (for login)
 */
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Get user by id with safe fields only (for deserializeUser / current session)
 */
function getUserById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, name FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Timing-safe password verification
 */
function verifyPassword(password, salt, expectedHashHex) {
  try {
    const hash = crypto.scryptSync(password, salt, 32);
    const expected = Buffer.from(expectedHashHex, 'hex');
    return hash.length === expected.length &&
           crypto.timingSafeEqual(hash, expected);
  } catch (err) {
    return false;
  }
}

module.exports = {
  getUserByUsername,
  getUserById,
  verifyPassword
};
