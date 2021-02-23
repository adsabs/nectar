FROM node:lts
WORKDIR /app
COPY . /app
ENTRYPOINT [ "yarn", "build" ]