'use strict';

const sqlite = require('sqlite3');

// Open the SQLite database file
const db = new sqlite.Database('./last-race.sqlite', (err) => {
  if (err) {
    console.error('Error opening database: ', err.message);
    throw err;
  }
  // Enable foreign key support in SQLite
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
      console.error('Error enabling foreign keys: ', err.message);
    }
  });
  console.log('Connected to the SQLite database last-race.sqlite');
});

module.exports = db;
