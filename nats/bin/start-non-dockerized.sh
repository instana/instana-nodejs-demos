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
pushd `dirname $BASH_SOURCE`/../publisher-app > /dev/null
node publisher 2>&1 >>../publisher.log &
NATS_PUBLISHER_PID=$!
cd ../subscriber-app
node subscriber 2>&1 >> ../subscriber.log &
NATS_SUBSCRIBER_PID=$!
popd > /dev/null

echo "To stop everything, run \"kill $NATS_PUBLISHER_PID $NATS_SUBSCRIBER_PID\""
echo ""

