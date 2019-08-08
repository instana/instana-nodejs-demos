'use strict';

require('@instana/collector')();

const bodyParser = require('body-parser');
const rp = require('request-promise');
const execute = require('apollo-link').execute;
const express = require('express');
const morgan = require('morgan');

const serverAddress = process.env.SERVER_ADDRESS || 'localhost';
const serverPort = process.env.SERVER_PORT || 3217;
const serverBaseUrl = `http://${serverAddress}:${serverPort}`;
const serverGraphQLEndpoint = `${serverBaseUrl}/graphql`;

const app = express();
const port = process.env.APP_PORT || 3216;
const logPrefix = `GraphQL Client (${process.pid}):\t`;

const selfUrl = `http://127.0.0.1:${port}`;

if (process.env.WITH_STDOUT) {
  app.use(morgan(`${logPrefix}:method :url :status`));
}

app.use(bodyParser.json());

app.get('/', (req, res) => res.sendStatus(200));

app.get('/find-users-and-orders', (req, res) => runQuery(res, 'Users'));

app.post('/update-user', (req, res) => {
  return runMutation(res, {
    id: 1234,
    name: 'Alicia',
    email: 'alicia@example.com',
    address: 'Still Redacted',
  });
});

function runQuery(res) {
  const query = `
    query Users {
      Users(email: "*") {
        id
        name
        email
        address
      }
      Orders { items }
    }
  `;
  return rp({
    method: 'POST',
    url: serverGraphQLEndpoint,
    json: true,
    body: {
      query,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (response.errors && response.errors.length > 0) {
        return res.status(500).send(response);
      }
      res.send(response);
    })
    .catch(e => {
      log(e);
      res.sendStatus(500);
    });
}

function runMutation(res, input) {
  const mutation = `
    mutation UpdateUser($id: ID!, $name: String, $email: String, $address: String) {
      UpdateUser(input: { id: $id, name: $name, email: $email, address: $address }) {
        id
        name
        email
        address
      }
    }
  `;
  return rp({
    method: 'POST',
    url: serverGraphQLEndpoint,
    json: true,
    body: {
      query: mutation,
      variables: input,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (response.errors && response.errors.length > 0) {
        return res.status(500).send(response);
      }
      res.send(response);
    })
    .catch(e => {
      log(e);
      res.sendStatus(500);
    });
}

app.listen(port, () => {
  log(`Listening on port ${port} (downstream server port: ${serverPort}).`);
});

setTimeout(startCalls, 10000);

function startCalls() {
  // Run some call every few seconds...
  setInterval(() => {
    let doMutation = false;
    if (Math.random() >= 0.5) {
      doMutation = true;
    }

    const verb = doMutation ? 'POST' : 'GET';
    const urlPath = doMutation ? '/update-user' : '/find-users-and-orders';
    const fullUrl = `${selfUrl}${urlPath}`;

    log(`Triggering a ${doMutation ? 'mutation' : 'query'} (${fullUrl})`);

    // ... by triggering an http request to ourselves which in turn triggers a GraphQL call.
    return rp({
      method: verb,
      url: fullUrl,
    })
      .then(response => {
        log(`${doMutation ? 'mutation' : 'query'} done, response: ${response}`);
      })
      .catch(e => {
        log(e);
      });
  }, 4000);
}

function log() {
  /* eslint-disable no-console */
  const args = Array.prototype.slice.call(arguments);
  args[0] = logPrefix + args[0];
  console.log.apply(console, args);
}
