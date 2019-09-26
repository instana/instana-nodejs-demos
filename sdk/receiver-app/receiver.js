'use strict';

const instana = require('@instana/collector')();

const os = require('os');
const net = require('net');
const requestPromise = require('request-promise');
const pino = require('pino')();

const hostname = os.hostname();
const port = process.env.APP_PORT || 3216;

const logPrefix = `SDK Receiver (${process.pid}):\t`;

const server = net.createServer(socket => {
  log('a client has connected');
  socket.on('end', () => {
    log('client has disconnected');
  });

  socket.on('data', message => {
    message = JSON.parse(message.toString());
    log(`received: ${message}`);

    if (message.api === 'promise') {
      processWithPromiseApi(message);
    } else {
      processWithCallbackApi(message);
    }
  });
});

function processWithPromiseApi(message) {
  // This is the handler for incoming TCP messages. Since TCP messages are not automatically traced by Instana, we use
  // the Instana Node.js SDK to create calls.

  instana.sdk.promise
    .startEntrySpan(
      // You will need to provide a name for the span.
      'incoming-tcp-message',

      // You can pass in an object with custom tags. This is optional. Here, we model the incoming TCP message as an
      // RPC-style call.
      {
        rpc: {
          call: 'tcp/promise',
          host: hostname,
          port,
          flavor: 'TCP',
        },
      },
    )
    .then(
      // The then-handler of the promise needs to wraps the work that is triggered by the incoming call.
      () => {
        // Once an _entry_ span has been created (either via SDK or by auto-tracing), tracing is active. As long as we
        // stay in the same asynchronous context, all outgoing exit calls will be automatically traced - provided they
        // are made via one of the supported libraries: https://docs.instana.io/ecosystem/node-js/#supported-libraries

        // For example, the package 'pino' is a logger library that we support, so this log warning will appear in the
        // trace:
        pino.warn('Bogus warning: Please ignore this and move on.');

        // In addition to all automatically traced spans, we can of course also create more custom spans by using the
        // startExitSpan methods.
        instana.sdk.promise
          .startExitSpan(
            'db-call',
            // Let's pretend the outgoing call is a database call (and also assume the database module is not
            // instrumented by Instana automatically otherwise we wouldn't need to use the SDK):
            {
              db: {
                instance: 'my-example-db',
                type: 'sql',
                statement: 'DROP TABLE CUSTOMERS',
                user: 'sa',
              },
            },
          )
          .then(() => {
            // In lieu of an actual DB call we use a setTimeout here to represent something asynchronous happening
            // (like a database call):
            setTimeout(() => {
              instana.sdk.promise.completeExitSpan();
              // Also, request promise (and everything else that uses the Node.js core HTTP client code under the hood) is
              // supported, so this outgoing HTTP call will be included in the trace automatically.
              requestPromise('http://example.com').finally(() => {
                // Let's simulate an error for a percentage of calls.
                let error = null;
                if (message.error) {
                  error = new Error('Something went horribly wrong');
                }
                instana.sdk.promise.completeEntrySpan(error);
              });
            }, 200);
          });
      },
    );
}

function processWithCallbackApi(message) {
  // This is the handler for incoming TCP messages. Since TCP messages are not automatically traced by Instana, we use
  // the Instana Node.js SDK to create calls.

  instana.sdk.callback.startEntrySpan(
    // You will need to provide a name for the span.
    'incoming-tcp-message',

    // You can pass in an object with custom tags. This is optional. Here, we model the incoming TCP message as an
    // RPC-style call.
    {
      rpc: {
        call: 'tcp/callback',
        host: hostname,
        port,
        flavor: 'TCP',
      },
    },

    // The final parameter needs to be a callback that wraps the work that is triggered by the incoming call.
    () => {
      // Once an _entry_ span has been created (either via SDK or by auto-tracing), tracing is active. As long as we
      // stay in the same asynchronous context, all outgoing exit calls will be automatically traced - provided they
      // are made via one of the supported libraries: https://docs.instana.io/ecosystem/node-js/#supported-libraries

      // For example, the package 'pino' is a logger library that we support, so this log warning will appear in the
      // trace:
      pino.warn('Bogus warning: Please ignore this and move on.');

      // In addition to all automatically traced spans, we can of course also create more custom spans by using the
      // startExitSpan methods.
      instana.sdk.callback.startExitSpan(
        'db-call',
        // Let's pretend the outgoing call is a database call (and also assume the database module is not
        // instrumented by Instana automatically otherwise we wouldn't need to use the SDK):
        {
          db: {
            instance: 'my-example-db',
            type: 'sql',
            statement: 'DROP TABLE CUSTOMERS',
            user: 'sa',
          },
        },

        () => {
          // In lieu of an actual DB call we use a setTimeout here to represent something asynchronous happening
          // (like a database call):
          setTimeout(() => {
            instana.sdk.callback.completeExitSpan();
            // Also, request promise (and everything else that uses the Node.js core HTTP client code under the hood) is
            // supported, so this outgoing HTTP call will be included in the trace automatically.
            requestPromise('http://example.com').finally(() => {
              // Let's simulate an error for a percentage of calls.
              let error = null;
              if (message.error) {
                error = new Error('Something went horribly wrong');
              }
              instana.sdk.callback.completeEntrySpan(error);
            });
          }, 200);
        },
      );
    },
  );
}

server.listen(port, process.env.BIND_ADDRESS || '127.0.0.1');
log(`Listening on port: ${port}`);

function log() {
  /* eslint-disable no-console */ const args = Array.prototype.slice.call(
    arguments,
  );
  args[0] = `${logPrefix}${args[0]}`;
  console.log.apply(console, args);
}
