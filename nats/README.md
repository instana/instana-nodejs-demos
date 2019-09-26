# Instana NATS Demo

This directory contains a demo to test Instana's NATS support released with version 161.

## Prerequisites

- A `docker-compose` installation running on your machine. This demo has been created and tested on Mac OS X with `docker-compose` and `docker-machine`.
- Access to an Instana tenant v161 or higher.

## Configure

If you have not already done so, create an `.env` file in the root folder of this repository and enter the following text, with the values adjusted as necessary:

with the following content (values adjusted as necessary):

```text
agent_key=<ENTER YOUR AGENT KEY HERE>
agent_endpoint=<local ip or remote host; e.g., saas-us-west-2.instana.io>
agent_endpoint_port=<443 already set as default; or 4443 for local>
agent_zone=<optional, name of the zone for the agent; default: nodejs-demos>
```

## Build

Run

```bash
docker-compose build
```

in this directory.

## Launch

Run

```bash
docker-compose up
```

in this directory.

This will build and launch:

- A Dockerized Instana agent,
- a NATS server,
- the `publisher-app` Node.js application, which sends messages to the NATS server every four seconds, and
- the `subscriber-app` Node.js application, which consumes those messages from the NATS server.

After the agent is bootstrapped and starts accepting spans from the test applications, the results are visible, for example, in the Analyze view when filtering calls and traces via the call type `MESSAGING`.
