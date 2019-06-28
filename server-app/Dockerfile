FROM node:10

ADD package.json package.json
ADD package-lock.json package-lock.json
ADD server.js server.js

RUN npm install

CMD ["node", "."]
