'use strict';

const net = require('net');

const downstreamHost = process.env.DOWNSTREAM_HOST || '127.0.0.1';
const downstreamTcpPort = process.env.DOWNSTREAM_PORT
  ? parseInt(process.env.DOWNSTREAM_PORT, 10)
  : 3216;

const logPrefix = `SDK Sender (${process.pid}):\t`;

const client = new net.Socket();

const RECONNECT_TIMEOUT = 1000;
const MESSAGE_TIMEOUT = 4000;

const NOT_CONNECTED = 'NOT_CONNECTED';
const TRYING_TO_CONNECT = 'TRYING_TO_CONNECT';
const CONNECTED = 'CONNECTED';

let state = NOT_CONNECTED;

log(`Trying to connect to ${downstreamHost}:${downstreamTcpPort}.`);

function tryToConnect() {
  state = TRYING_TO_CONNECT;
  client.connect(downstreamTcpPort, downstreamHost, function() {
    if (state !== CONNECTED) {
      log('connected to server');
      state = CONNECTED;
    }
  });
}

client.on('error', function(err) {
  if (state === 'NOT_CONNECTED') {
    log('Received error while not connected, will try to connect now.', err);
    tryToConnect();
  } else if (state === 'TRYING_TO_CONNECT') {
    if (err.syscall === 'connect' && err.code === 'ECONNREFUSED') {
      log(
        'Received connection refused on connection attempt, will try again...',
      );
    } else {
      log('Received error on connection attempt, will try again.', err);
    }
    setTimeout(tryToConnect, RECONNECT_TIMEOUT);
  } else if (state === 'CONNECTED') {
    log('Received error while connected, will try to re-connect.', err);
    state = NOT_CONNECTED;
    tryToConnect();
  } else {
    throw new Error(`Unknown state ${state}`);
  }
});

client.on('data', function(data) {
  log(`received: ${data}`);
  if (data === 'BYE') {
    client.destroy();
  }
});

client.on('close', function() {
  if (state === CONNECTED) {
    log('TCP connection closed, will try to connect again.');
    state = NOT_CONNECTED;
    tryToConnect();
  }
});

setTimeout(startCalls, MESSAGE_TIMEOUT);

function startCalls() {
  // Run some call every few seconds...
  setInterval(() => {
    if (state !== CONNECTED) {
      // log('waiting for connection to be established...');
      return;
    }

    let withError = false;
    let randomNumber = Math.random();
    if (randomNumber >= 0.5) {
      withError = true;
    }

    let withPromiseApi = true;
    randomNumber = Math.random();
    if (randomNumber >= 0.5) {
      withPromiseApi = false;
    }

    const message = `{"api": "${
      withPromiseApi ? 'promise' : 'callback'
    }", "error": ${withError} }`;

    log(`sending a message: ${message}`);

    client.write(message);
  }, MESSAGE_TIMEOUT);
}

tryToConnect();

function log() {
  /* eslint-disable no-console */
  const args = Array.prototype.slice.call(arguments);
  args[0] = `${logPrefix}${args[0]}`;
  console.log.apply(console, args);
}
