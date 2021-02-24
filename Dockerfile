FROM node:lts
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile --production
ENTRYPOINT [ "yarn", "build", "&&", "yarn", "start" ]