'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const { body, param, validationResult } = require('express-validator');

const passport = require('./auth/passport-config');
const networkDao = require('./dao/network-dao');
const gameDao = require('./dao/game-dao');
const gameService = require('./services/game-service');

const app = express();
const port = 3001;

// Logging in dev environment
app.use(morgan('dev'));

// CORS configuration (allow requests from React frontend on port 5173 with credentials)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Session management
app.use(session({
  secret: 'last-race-secret-key-4217',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax', // necessary for CORS with cookie-sharing in local dev
    secure: false    // do not set to true over local http, it will break session storage
  }
}));

// Initialize passport session support
app.use(passport.authenticate('session'));

// Reusable middleware to verify if a user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// Utility to handle validator error reports
function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}


/* --- AUTHENTICATION API ENDPOINTS --- */

// POST /api/sessions (Login)
app.post(
  '/api/sessions',
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  checkValidation,
  (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Login failed' });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        // Successful login, returns safe user object
        return res.json(user);
      });
    })(req, res, next);
  }
);

// GET /api/sessions/current (Get current session user)
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }
  return res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /api/sessions/current (Logout)
app.delete('/api/sessions/current', isLoggedIn, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(204).end();
  });
});


/* --- GAME & NETWORK FLOW API ENDPOINTS --- */

// GET /api/network (Retrieves full network details with lines for initial Setup stage)
app.get('/api/network', isLoggedIn, async (req, res, next) => {
  try {
    const stations = await networkDao.getStations();
    const lines = await networkDao.getLinesWithStations();
    res.json({ stations, lines });
  } catch (err) {
    next(err);
  }
});

// POST /api/games (Starts a game planning phase)
app.post('/api/games', isLoggedIn, async (req, res, next) => {
  try {
    // 1. Assign start and destination using BFS
    const { start, destination } = await gameService.assignStartAndDest();

    // 2. Create the game row in database
    const gameId = await gameDao.createGame(req.user.id, start.id, destination.id);

    // 3. Build unique segments alphabetically without lines details
    const networkGraph = await gameService.getNetworkGraph();
    const stations = await networkDao.getStations();

    // Convert segment map into display list of segments
    const uniqueSegmentsMap = new Map();
    for (const [key, linesSet] of networkGraph.segmentLines.entries()) {
      const [u, v] = key.split('-').map(Number);
      const stationA = networkGraph.stationLookup.get(u);
      const stationB = networkGraph.stationLookup.get(v);

      // Normalize segments so that a.name <= b.name for stable alphabetical display
      let a = stationA;
      let b = stationB;
      if (a.name.localeCompare(b.name) > 0) {
        a = stationB;
        b = stationA;
      }

      uniqueSegmentsMap.set(key, {
        id: key,
        a: { id: a.id, name: a.name },
        b: { id: b.id, name: b.name }
      });
    }

    const segmentsList = Array.from(uniqueSegmentsMap.values());

    // Sort segments alphabetically by a.name then b.name
    segmentsList.sort((x, y) => {
      const compA = x.a.name.localeCompare(y.a.name);
      if (compA !== 0) return compA;
      return x.b.name.localeCompare(y.b.name);
    });

    res.json({
      gameId,
      start: { id: start.id, name: start.name },
      destination: { id: destination.id, name: destination.name },
      stations,
      segments: segmentsList,
      durationSeconds: 90,
      serverTime: Date.now()
    });

  } catch (err) {
    next(err);
  }
});

// POST /api/games/:gameId/route (Validates and executes the selected route)
app.post(
  '/api/games/:gameId/route',
  isLoggedIn,
  param('gameId').isInt().toInt().withMessage('Game ID must be an integer'),
  body('segments').isArray({ min: 1 }).withMessage('Segments must be a non-empty array'),
  body('segments.*').matches(/^\d+-\d+$/).withMessage('Malformed segment keys'),
  checkValidation,
  async (req, res, next) => {
    const gameId = req.params.gameId;
    const userId = req.user.id;
    const { segments } = req.body;

    try {
      const execution = await gameService.executeGame(gameId, userId, segments);
      if (execution.error) {
        return res.status(execution.status).json({ error: execution.error });
      }
      return res.json(execution.result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/ranking (Leaderboard ranking)
app.get('/api/ranking', isLoggedIn, async (req, res, next) => {
  try {
    const ranking = await gameDao.getRanking();
    res.json(ranking);
  } catch (err) {
    next(err);
  }
});


/* --- CENTRAL ERROR HANDLER --- */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Last Race server listening at http://localhost:${port}`);
});