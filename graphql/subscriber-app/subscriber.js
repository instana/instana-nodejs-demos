'use strict';

require('@instana/collector')();

const rp = require('request-promise');
const execute = require('apollo-link').execute;
const express = require('express');
const morgan = require('morgan');
const SubscriptionClient = require('subscriptions-transport-ws')
  .SubscriptionClient;
const WebSocketLink = require('apollo-link-ws').WebSocketLink;
const ws = require('ws');

const serverAddress = process.env.SERVER_ADDRESS || 'localhost';
const serverPort = process.env.SERVER_PORT || 3217;
const serverWsGraphQLUrl = `ws://${serverAddress}:${serverPort}/graphql`;

const app = express();
const port = process.env.APP_PORT || 3215;
const logPrefix = `GraphQL Subscriber Client (${process.pid}):\t`;

const selfUrl = `http://127.0.0.1:${port}`;

if (process.env.WITH_STDOUT) {
  app.use(morgan(`${logPrefix}:method :url :status`));
}

app.get('/', (req, res) => res.sendStatus(200));

function establishSubscription() {
  const subscribeQuery = `
    subscription OnUserUpdated($id: ID!) {
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
      id: 1234,
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
  log('Subscription has been established.');
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

setTimeout(establishSubscription, 10000);

function log() {
  /* eslint-disable no-console */
  const args = Array.prototype.slice.call(arguments);
  args[0] = logPrefix + args[0];
  console.log.apply(console, args);
}
