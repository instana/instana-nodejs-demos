#!/usr/bin/env bash

set -e

if [ "$1" != start ]; then
  echo ""
  echo "If you just want to spin up the demo, you should probably be using the docker-compose based variant. Run:"
  echo ""
  echo "docker-compose build && docker-compose up"
  echo ""
  echo "(Note: If you really want to start the Node.js apps locally, run \"$0 start\".)"
  echo ""
  exit 1
fi

echo "Okay, starting everything non-dockerized..."
pushd `dirname $BASH_SOURCE`/../server-app > /dev/null
node server 2>&1 >>../server.log &
GRAPHQL_SERVER_PID=$!
cd ../client-app
node client 2>&1 >> ../client.log &
GRAPHQL_CLIENT_PID=$!
cd ../subscriber-app
node subscriber 2>&1 >> ../subscriber.log &
GRAPHQL_SUBSCRIBER_PID=$!
popd > /dev/null

echo "To stop everything, run \"kill $GRAPHQL_SERVER_PID $GRAPHQL_CLIENT_PID $GRAPHQL_SUBSCRIBER_PID\""
echo ""

