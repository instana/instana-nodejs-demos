'use strict';

const agentPort = process.env.AGENT_PORT;

const instana = require('@instana/collector')();

const natsStreaming = require('node-nats-streaming');

const port = process.env.APP_PORT || 3215;
const natsHost = process.env.NATS_HOST || '127.0.0.1';
const natsPort = process.env.NATS_PORT || '4223';
const natsUrl = `nats://${natsHost}:${natsPort}`;

const client = natsStreaming.connect('test-cluster', 'test-client-subscriber', {
  url: natsUrl,
});

client.on('connect', function() {
  log('Connection to NATS streaming server established');

  client.on('error', function(err) {
    log('NATS streaming error', err);
  });

  const opts = client
    .subscriptionOptions()
    .setStartWithLastReceived()
    .setManualAckMode(true)
    .setAckWait(1000);
  const subscription = client.subscribe('test-subject', opts);
  subscription.on('message', function(msg) {
    log(`received: [${msg.getSequence()}] ${msg.getData()}`);
    msg.ack();
    const span = instana.currentSpan();
    span.disableAutoEnd();
    try {
      if (msg.getData().indexOf('trigger an error') >= 0) {
        log('triggering an error...');
        throw new Error('Boom!');
      }
    } finally {
      setTimeout(() => {
        span.end();
      }, 100);
    }
  });

  subscription.on('error', err => {
    log('received error event', err.message);
  });
});

function log() {
  /* eslint-disable no-console */
  const args = Array.prototype.slice.call(arguments);
  args[0] = `NATS Subscriber (${process.pid}):\t${args[0]}`;
  console.log.apply(console, args);
}
