// /!\ WARNING
//
// This is a demo server, you MUST NOT use it *as is* in production!
//
// The only purpose of this program is to illustrate how to provide a
// backend server to the demo applications using the Tanker SDK.

// @flow
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const userToken = require('@tanker/user-token');
const sodium = require('libsodium-wrappers-sumo');
const debugMiddleware = require('debug-error-middleware').express;

const authMiddleware = require('./middlewares/auth');
const corsMiddleware = require('./middlewares/cors');

const config = require('./config');
const log = require('./log');
const home = require('./home');
const Storage = require('./storage');

// Build express application
const app = express();

// Setup server
const setup = (serverConfig) => {
  const { dataPath } = serverConfig;
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }
  app.storage = new Storage(dataPath);
  return app;
};


app.use(corsMiddleware); // enable CORS
app.use(bodyParser.text());
app.use(bodyParser.json());
app.options('*', corsMiddleware); // enable pre-flight CORS requests

// Show helpful error messages. In a production server,
// remove this as it could leak sensitive information.
app.use(debugMiddleware());


// Add routes for the server's home page (readmes...)
app.use(home);


// Add middlewares to log requests on routes defined below
app.use(morgan('dev'));
app.use((req, res, next) => {
  const { userId } = req.query;
  const maybeFrom = userId ? ` from ${userId}:` : ':';
  log(`New ${req.path} request${maybeFrom}`);
  next();
});


// Add signup route (non authenticated)
app.get('/signup', (req, res) => {
  const { userId, password } = req.query;
  if (password === undefined) {
    res.status(400).send('missing password');
    return;
  }
  const hashedPassword = sodium.crypto_pwhash_str(
    password,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
  );

  if (app.storage.exists(userId)) {
    log(`User "${userId}" already exists`, 1);
    res.sendStatus(409);
    return;
  }

  log('Generate a new user token', 1);
  const token = userToken.generateUserToken(
    config.trustchainId,
    config.trustchainPrivateKey,
    userId,
  );

  log('Save password and token to storage', 1);
  app.storage.save({ id: userId, hashed_password: hashedPassword, token });

  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.status(201).send(token);
});


// Add authentication middleware for all routes below
//   - check valid "userId" and "password" query params
//   - set res.locals.user for the request handlers
const authFunc = authMiddleware(app);
app.use(authFunc);


// Add authenticated routes
app.get('/login', (req, res) => {
  log('Retrieve token from storage', 1);
  const { user } = res.locals;

  log('Serve the token', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.token);
});

app.put('/data', (req, res) => {
  const { user } = res.locals;

  log('Save data on storage', 1);
  try {
    user.data = req.body;
    app.storage.save(user);
  } catch (e) {
    log(e, 1);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(200);
});

app.delete('/data', (req, res) => {
  const { user } = res.locals;

  log('Clear user data', 1);
  app.storage.clearData(user.id);
  res.sendStatus(200);
});

app.get('/data/:userId', (req, res) => {
  const { userId } = req.params;
  log('Retrieve data from storage', 1);

  if (!app.storage.exists(userId)) {
    log(`User ${userId} does not exist`);
    res.sendStatus(404);
    return;
  }
  const user = app.storage.get(userId);

  if (!user.data) {
    log('User has no stored data', 1);
    res.sendStatus(404);
    return;
  }

  log('Serve the data', 1);
  res.set('Content-Type', 'text/plain');
  res.send(user.data);
});


app.get('/users', (req, res) => {
  const knownIds = app.storage.getAllIds();

  res.set('Content-Type', 'application/json');
  res.json(knownIds);
});

// Register a new share
app.post('/share', (req, res) => {
  const { from, to } = req.body;
  // ensure only the current user can share their note with others
  if (from !== res.locals.user.id) {
    res.sendStatus(401);
    return;
  }

  app.storage.share(from, to);
  res.sendStatus('201');
});

app.get('/me', (req, res) => {
  // res.locals.user is set by the auth middleware
  const me = res.locals.user;
  res.json(me);
});

// Return nice 500 message when an exception is thrown
const errorHandler = (err, req, res, next) => { // eslint-disable-line  no-unused-vars
  res.status(500);
  res.json({ error: err.message });
  // Note: we don't call next() because we don't want the request to continue
};
app.use(errorHandler);


const listen = port => app.listen(port);

module.exports = {
  listen,
  setup,
};
