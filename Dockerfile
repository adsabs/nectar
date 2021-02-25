FROM node:14.15.5-buster-slim
WORKDIR /app

# copy assets
COPY .env .
COPY ./package*.json .
COPY yarn.lock .
COPY lerna.json .
COPY ./packages/ ./packages/

# add lerna dep
RUN yarn global add lerna

# install deps in all packages and start production build
RUN yarn bootstrap
RUN yarn build

# set env variable port and expose
ENV PORT=8000
EXPOSE $PORT

CMD [ "yarn", "start" ]