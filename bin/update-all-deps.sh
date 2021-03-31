#!/usr/bin/env bash

#######################################
# (c) Copyright IBM Corp. 2021
# (c) Copyright Instana Inc. and contributors 2020
#######################################

set -eo pipefail

cd `dirname $BASH_SOURCE`/..

pushd graphql/client-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd graphql/server-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd graphql/subscriber-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd nats/publisher-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd nats/subscriber-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd nats-streaming/publisher-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd nats-streaming/subscriber-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd sdk/receiver-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd
pushd sdk/sender-app > /dev/null
npx -package npm-check-updates ncu --upgrade && npm install
popd

