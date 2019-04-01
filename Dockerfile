FROM node:10.0.0

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY bin ./bin
COPY lib ./lib
COPY index.js ./

ENTRYPOINT ["node", "/app/bin/cli.js"]
