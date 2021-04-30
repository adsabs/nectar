FROM node:14.15.5-buster-slim
WORKDIR /app

# copy assets
COPY . .

# install deps
RUN yarn --pure-lockfile

# start production build
RUN yarn build

# set env variable port and expose
ENV PORT=8000
EXPOSE $PORT

CMD [ "yarn", "start" ]