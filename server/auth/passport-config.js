'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local');
const userDao = require('../dao/user-dao');

// Passport strategy definition for checking credentials
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await userDao.getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: 'Wrong username or password' });
    }
    const verified = userDao.verifyPassword(password, user.salt, user.hash);
    if (!verified) {
      return done(null, false, { message: 'Wrong username or password' });
    }
    // Return safe user information only
    return done(null, { id: user.id, username: user.username, name: user.name });
  } catch (err) {
    return done(err);
  }
}));

// Serialize user ID to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user details from ID stored in session on each incoming request
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userDao.getUserById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
