/* global Promise */

'use strict';

require('@instana/collector')();

// Inject Instana's EUM snippet into GraphiQL playground app:
const eumReportingUrl =
  process.env.INSTANA_EUM_REPORTING_URL || 'https://eum-us-west-2.instana.io';
const eumKey = process.env.INSTANA_EUM_KEY;
const eumPage =
  process.env.INSTANA_EUM_PAGE ||
  'instana-graphql-demo-server/GraphiQL Playground';
if (eumKey) {
  const playgroundHtml = require('@apollographql/graphql-playground-html');
  const originalPlaygroundRenderFunction = playgroundHtml.renderPlaygroundPage;
  playgroundHtml.renderPlaygroundPage = function() {
    const html = originalPlaygroundRenderFunction.apply(this, arguments);
    if (typeof html === 'string') {
      return html.replace(
        /<!DOCTYPE html>\s*<html>\s*<head>/i,
        `<!DOCTYPE html>
         <html>
         <head>
         <script>
           (function(c,e,f,k,g,h,b,a,d){c[g]||(c[g]=h,b=c[h]=function(){
           b.q.push(arguments)},b.q=[],b.l=1*new Date,a=e.createElement(f),a.async=1,
           a.src=k,a.setAttribute("crossorigin", "anonymous"),d=e.getElementsByTagName(f)[0],
           d.parentNode.insertBefore(a,d))})(window,document,"script",
           "//eum.instana.io/eum.min.js","InstanaEumObject","ineum");
           ineum('reportingUrl', '${eumReportingUrl}');
           ineum('key', '${eumKey}');
           ineum('page', '${eumPage}');
         </script>`,
      );
    }
    return html;
  };
} else {
  console.log(
    "EUM values are not configured, won't inject the EUM snippet into the GraphiQL Playground.",
  );
}

const {ApolloServer, gql} = require('apollo-server-express');
const bodyParser = require('body-parser');
const express = require('express');
const graphqlSubscriptions = require('graphql-subscriptions');
const http = require('http');
const morgan = require('morgan');

const port = process.env.APP_PORT || 3217;
const app = express();
const pubsub = new graphqlSubscriptions.PubSub();

const logPrefix = `GraphQL/Apollo Server (${process.pid}):\t`;

if (process.env.WITH_STDOUT) {
  app.use(morgan(`${logPrefix}:method :url :status`));
}

app.use(bodyParser.json());

const typeDefs = gql`
  type Query {
    Users(email: String): [User]
    Orders: [Order]
  }

  type Mutation {
    UpdateUser(input: UserUpdateInput): User
  }

  type Subscription {
    OnUserUpdated(id: ID!): User
  }

  type User {
    id: ID
    name: String
    email: String
    address: String
  }

  type Order {
    id: ID
    items: String
  }

  input UserUpdateInput {
    id: ID!
    name: String
    email: String
    address: String
  }
`;

const resolvers = {
  Query: {
    Users: () => {
      log('Running a query for "Users".');
      maybeSimulateError();
      return [
        {
          id: 1234,
          name: 'Alice',
          email: 'alice@example.com',
          address: 'Redacted',
        },
        {
          id: 1235,
          name: 'Bob',
          email: 'bob@example.com',
          address: 'Redacted',
        },
      ];
    },
    Orders: () => {
      log('Running a query for "Orders".');
      return [
        {
          id: 987654321,
          items: 'Such GraphQL tracing. Much wow',
        },
      ];
    },
  },
  Mutation: {
    UpdateUser: (root, {input}) => {
      log('Running a mutation.');
      log('Notifying subscribers.');
      maybeSimulateError();
      pubsub.publish('OnUserUpdated', {
        OnUserUpdated: input,
      });
      return {
        id: input.id,
        name: input.name,
        email: input.email,
        address: input.address,
      };
    },
  },
  Subscription: {
    OnUserUpdated: {
      subscribe: (__, {id}) => {
        log('Registering a subscription.');
        return pubsub.asyncIterator('OnUserUpdated');
      },
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

app.get('/', (req, res) => {
  res.sendStatus(200);
});

app.post('/publish-update', (req, res) => {
  let {id, name} = req.body;
  if (id == null) {
    id = 1234;
  }
  if (typeof id === 'string') {
    id = parseInt(id, 10);
  }
  if (isNaN(id) || id <= 0) {
    id = 1234;
  }
  const updatedUser = {
    id: 1234,
    name: name | 'Alicia',
    email: 'alicia@example.com',
    address: 'Still Redacted',
  };
  pubsub.publish('OnUserUpdated', {
    OnUserUpdated: updatedUser,
  });
  res.send(updatedUser);
});

server.applyMiddleware({app});

const httpServer = http.createServer(app);

server.installSubscriptionHandlers(httpServer);

httpServer.listen({port}, () => {
  log(
    `Listening on ${port} (HTTP & Websocket), GraphQL endpoint: http://localhost:${port}${server.graphqlPath}, GraphiQL explorer also at: http://localhost:${port}${server.graphqlPath}`,
  );
});

function maybeSimulateError() {
  if (Math.random() < 0.3) {
    throw new Error(
      'This GraphQL call failed with a simulated error to showcase that Instana captures GraphQL errors nicely.',
    );
  }
}

function log() {
  /* eslint-disable no-console */
  const args = Array.prototype.slice.call(arguments);
  args[0] = logPrefix + args[0];
  console.log.apply(console, args);
}
