FROM node
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
RUN npm run build

ENV NPM_CONFIG_LOGLEVEL info
EXPOSE 3000

USER node

CMD npm start