FROM node:14.15.5-alpine
WORKDIR /app

COPY ./package*.json .
COPY yarn.lock .

COPY ./packages/components ./components
COPY ./packages/frontend ./frontend
COPY ./packages/server ./server

RUN yarn install --silent --frozen-lockfile --non-interactive

WORKDIR /app/components
RUN yarn install --silent --frozen-lockfile --non-interactive
RUN yarn build

WORKDIR /app/frontend
RUN yarn install --silent --frozen-lockfile --non-interactive
RUN yarn build

WORKDIR /app/server
RUN yarn install --silent --frozen-lockfile --non-interactive
RUN yarn build

CMD [ "yarn", "start" ]