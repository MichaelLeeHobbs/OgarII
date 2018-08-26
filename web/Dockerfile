FROM node
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

ENV NPM_CONFIG_LOGLEVEL info
EXPOSE 3000

USER node

CMD npm start