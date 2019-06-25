#!/usr/bin/env sh

echo "Make sure there is an agent running on localhost:42699 :-)"
echo "Starting server and client in background..."

node server > server.log &
echo SERVER PID: $!
node client > client.log &
echo CLIENT PID: $!

echo "YOU NEED TO KILL THOSE PROCESSES EXPLICITLY WHEN YOU ARE DONE!"
echo "See client.log and server.log for details."

echo "Creating GraphQL spans..."
