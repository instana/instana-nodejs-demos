# Instana Node.js SDK Demo

This directory contains a demo to test and showcase Instana's Node.js SDK. It also serves as an example for customers that want to start using the SDK in their own apps.

## Prerequisites

- A `docker-compose` installation running on your machine. This demo has been created and tested on Mac OS X with `docker-compose` and `docker-machine`.
- Access to an Instana tenant.

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
- the `sender-app` Node.js application, which sends raw TCP messages to `receiver-app`, and
- the `receiver-app` Node.js application, which listens to those incoming raw TCP messages.

Since Instana does not automatically trace custom TCP messages, this is a good example for how the Instana Node.js SDK can be used to create traces for those calls.

After the agent is bootstrapped and starts accepting spans from the test applications, the results are visible in the Analyze view when filtering for calls and traces via the call type `RPC`.
