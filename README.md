Instana GraphQL Example
=======================

A simple example of Instana's GraphQL tracing. Starts a server and a client Node.js app (both instrumented with Instana). The client regularly accesses the server via GraphQL call, randomly executing a query or a mutation.

1. Start an Instana agent and make sure it is connected to an Instana SAAS environment.
1. Run `./run.sh`. This will start a server and a client in the background.
1. The client will wait a few seconds, then start issuing GraphQL calls every 4 seconds, to which the server will respond.
1. You can find GraphQL calls in Instana easily by going to Analyze and adding a custom filter via "More": `call.graphql.operationType`, `is present`.
1. If you don't see any GraphQL calls in Instana after, check `server.log` and `client.log`.
1. The PIDs of server and client will be printed to the console on startup. Once you are done, make sure to `kill` both processes.
