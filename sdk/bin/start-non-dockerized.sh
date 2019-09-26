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
pushd `dirname $BASH_SOURCE`/../receiver-app > /dev/null
node receiver 2>&1 >>../receiver.log &
RECEIVER_PID=$!
cd ../sender-app
node sender 2>&1 >> ../sender.log &
SENDER_PID=$!
popd > /dev/null

echo "To stop everything, run \"kill $RECEIVER_PID $SENDER_PID\""
echo ""

