FROM node:10

ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install
ADD publisher.js publisher.js

CMD ["node", "."]
