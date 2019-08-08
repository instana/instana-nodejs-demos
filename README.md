# Instana Node.js Demos

This repository contains demo Node.js apps to showcase tracing support for selected libraries.

- [GraphQL](graphql/README.md)
- [NATS](nats/README.md)
- [NATS streaming](nats-streaming/README.md)

## Prerequisites

- You need to have `docker-compose` installed. The demos have been created and tested on Mac OS X with `docker-compose` and `docker-machine`.
- Access to an Instana tenant unit.

## Configure

Create a `.env` file in the root folder of the repository with the following content (values adjusted as necessary):

```text
agent_key=<ENTER YOUR AGENT KEY HERE>
agent_endpoint=<local ip or remote host; e.g., saas-us-west-2.instana.io>
agent_endpoint_port=<443 already set as default; or 4443 for local>
agent_zone=<optional, name of the zone for the agent; default: nodejs-demos>
```

This configuration is shared by all demo apps.

