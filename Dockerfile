FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY config.docker.json ./config.json

EXPOSE 3000

CMD node migrate.js && node app.js