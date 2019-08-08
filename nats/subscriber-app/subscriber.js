'use strict';

const agentPort = process.env.AGENT_PORT;

const instana = require('@instana/collector')();

const NATS = require('nats');

const port = process.env.APP_PORT || 3215;
const natsHost = process.env.NATS_HOST || '127.0.0.1';
const natsPort = process.env.NATS_PORT || 4222;
const natsUrl = `nats://${natsHost}:${natsPort}`;
const nats = NATS.connect(natsUrl);

nats.on('connect', function() {
  log('Connection to NATS server established');

  nats.on('error', function(err) {
    log('NATS error', err);
  });

  nats.subscribe('test-subject', function(msg, replyTo) {
    log(`received: "${msg}"`);
    const span = instana.currentSpan();
    span.disableAutoEnd();

    try {
      if (msg === 'trigger an error') {
        log('triggering an error...');
        throw new Error('Boom!');
      } else if (replyTo) {
        log('sending reply');
        nats.publish(replyTo, 'sending reply');
      }
    } finally {
      setTimeout(() => {
        span.end();
      }, 100);
    }
  });
});

function log() {
  /* eslint-disable no-console */
  const args = Array.prototype.slice.call(arguments);
  args[0] = `NATS Subscriber (${process.pid}):\t${args[0]}`;
  console.log.apply(console, args);
}
