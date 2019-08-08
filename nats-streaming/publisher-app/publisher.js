'use strict';

require('@instana/collector')();

const rp = require('request-promise');
const express = require('express');
const morgan = require('morgan');
const natsStreaming = require('node-nats-streaming');

const app = express();
const port = process.env.APP_PORT || 3216;
const natsHost = process.env.NATS_HOST || '127.0.0.1';
const natsPort = process.env.NATS_PORT || '4223';
const natsUrl = `nats://${natsHost}:${natsPort}`;

const client = natsStreaming.connect('test-cluster', 'test-client-publisher', {
  url: natsUrl,
});

const logPrefix = `NATS Streaming Publisher (${process.pid}):\t`;

const selfUrl = `http://127.0.0.1:${port}`;

if (process.env.WITH_STDOUT) {
  app.use(morgan(`${logPrefix}:method :url :status`));
}

client.on('connect', function() {
  log('Connection to NATS streaming server established');

  client.on('error', function(err) {
    log('NATS streaming error', err);
  });
});

client.on('close', function() {
  process.exit();
});

app.post('/publish', (req, res) => {
  const withPublisherError = req.query.withPublisherError;
  const withSubscriberError =
    !withPublisherError && req.query.withSubscriberError;

  // try to publish without a subject to trigger an error in the publisher
  const subject = withPublisherError ? null : 'test-subject';

  const message = withSubscriberError
    ? 'trigger an error'
    : "It's nuts, ain't it?!";

  try {
    client.publish(subject, message, (err, guid) => {
      if (err) {
        log('message published with error');
        return res.status(500).send(err.message);
      }
      log('message published successfully with guid: ' + guid);
      return res.sendStatus(200);
    });
  } catch (e) {
    log('error in publisher', e);
    return res.status(500).send(e.message);
  }
});

app.listen(port, () => {
  log(`Listening on port: ${port}`);
});

setTimeout(startCalls, 10000);

function startCalls() {
  // Run some call every few seconds...
  setInterval(() => {
    let withPublisherError = false;
    let withSubscriberError = false;
    const randomNumber = Math.random();
    if (randomNumber >= 0.666) {
      withPublisherError = true;
    } else if (randomNumber >= 0.333) {
      withSubscriberError = true;
    }

    let fullUrl = `${selfUrl}/publish`;
    if (withPublisherError) {
      fullUrl += '?withPublisherError=yes';
    } else if (withSubscriberError) {
      fullUrl += '?withSubscriberError=yes';
    }

    log(
      `Triggering a publish ${
        withPublisherError ? 'with an error in the publisher' : ''
      }${
        withSubscriberError ? 'with an error in the subscriber' : ''
      } (${fullUrl})`,
    );

    // ... by triggering an http request to ourselves which in turn triggers a NATS publish.
    return rp({
      method: 'POST',
      url: fullUrl,
    })
      .then(response => {
        log(`publish done, response: ${response}`);
      })
      .catch(e => {
        log(e);
      });
  }, 4000);
}

function log() {
  /* eslint-disable no-console */
  const args = Array.prototype.slice.call(arguments);
  args[0] = `${logPrefix}${args[0]}`;
  console.log.apply(console, args);
}
