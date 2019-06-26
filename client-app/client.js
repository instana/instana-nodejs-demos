'use strict';

require('@instana/collector')();

const bodyParser = require('body-parser');
const rp = require('request-promise');
const execute = require('apollo-link').execute;
const express = require('express');
const morgan = require('morgan');
const SubscriptionClient = require('subscriptions-transport-ws')
  .SubscriptionClient;
const WebSocketLink = require('apollo-link-ws').WebSocketLink;
const ws = require('ws');

const serverAddress = process.env.SERVER_ADDRESS;
const serverPort = process.env.SERVER_PORT || 3217;
const serverBaseUrl = `http://${serverAddress}:${serverPort}`;
const serverGraphQLEndpoint = `${serverBaseUrl}/graphql`;
const serverWsGraphQLUrl = `ws://${serverAddress}:${serverPort}/graphql`;

const app = express();
const port = process.env.APP_PORT || 3216;
const logPrefix = `GraphQL Client (${process.pid}):\t`;

const selfUrl = `http://127.0.0.1:${port}`;

if (process.env.WITH_STDOUT) {
  app.use(morgan(`${logPrefix}:method :url :status`));
}

app.use(bodyParser.json());

app.get('/', (req, res) => res.sendStatus(200));

app.get('/find-users-and-orders', (req, res) => runQuery(req, res, 'Users'));

app.post('/update-user', (req, res) => {
  return runUserMutation(req, res, {
    id: 1234,
    name: 'Alicia',
    email: 'alicia@example.com',
    address: 'Still Redacted',
  });
});

app.post('/subscription', (req, res) => establishSubscription(req, res));

app.post('/publish-update-via-http', (req, res) =>
  rp({
    method: 'POST',
    url: `${serverBaseUrl}/publish-update`,
    body: JSON.stringify({
      id: req.body.id || 1234,
      name: 'Alicia',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      res.send(response);
    })
    .catch(e => {
      log(e);
      res.sendStatus(500);
    }),
);

app.post('/publish-update-via-graphql', (req, res) =>
  runMutation(req, res, {
    id: req.body.id || 1234,
    name: 'Alicia',
  }),
);

function runQuery(req, res) {
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
    body: JSON.stringify({
      query,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      res.send(response);
    })
    .catch(e => {
      log(e);
      res.sendStatus(500);
    });
}

function runUserMutation(req, res, input) {
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
    body: JSON.stringify({
      query: mutation,
      variables: input,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      res.send(response);
    })
    .catch(e => {
      log(e);
      res.sendStatus(500);
    });
}

function establishSubscription(req, res) {
  const subscribeQuery = `
    subscription onUserUpdated($id: ID!) {
      OnUserUpdated(id: $id) {
        id
        name
      }
    }
  `;

  const subscriptionClient = createSubscriptionObservable(
    serverWsGraphQLUrl,
    subscribeQuery,
    {
      id: req.query.id || 1234,
    },
  );
  subscriptionClient.subscribe(
    eventData => {
      log(`user updated: ${JSON.stringify(eventData)}`);
    },
    err => {
      log(`user updated error: ${JSON.stringify(err)}`);
    },
  );
  res.sendStatus(204);
}

app.listen(port, () => {
  log(`Listening on port ${port} (downstream server port: ${serverPort}).`);
});

function createSubscriptionObservable(webSocketUrl, query, variables) {
  const webSocketClient = new SubscriptionClient(
    webSocketUrl,
    {reconnect: true},
    ws,
  );
  const webSocketLink = new WebSocketLink(webSocketClient);
  return execute(webSocketLink, {
    query: query,
    variables: variables,
  });
}

setTimeout(() => {
  startCalls();
}, 10000);

function startCalls() {
  // run some call every five seconds
  setInterval(() => {
    // http request to ourselves to trigger a GraphQL call.
    let doMutation = false;
    if (Math.random() >= 0.5) {
      doMutation = true;
    }

    const verb = doMutation ? 'POST' : 'GET';
    const urlPath = doMutation ? '/update-user' : '/find-users-and-orders';
    const fullUrl = `${selfUrl}${urlPath}`;

    log(`Triggering a ${doMutation ? 'mutation' : 'query'} (${fullUrl})`);

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
