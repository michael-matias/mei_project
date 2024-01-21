# API Gateway Dockerfile
FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

COPY ./certs/server.key /certs/server.key
COPY ./certs/server.crt /certs/server.crt

EXPOSE 443

CMD ["node", "index.js"]
