FROM node:8
WORKDIR /home/node/app
COPY package*.json ./
# Must run prep.sh first
# https://github.com/moby/moby/issues/37129
# COPY ../datafiles/ ./datafiles/
RUN yarn install
COPY . .

ENV NPM_CONFIG_LOGLEVEL info
EXPOSE 443

#USER node

CMD yarn start