FROM node:10

ADD package.json package.json
ADD package-lock.json package-lock.json
ADD client.js client.js

RUN npm install

CMD ["node", "client"]
