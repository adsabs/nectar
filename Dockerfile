FROM node:12

ENV PORT 8000

# create application directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# install deps
COPY package*.json /usr/src/app
RUN yarn install

# copy source files
COPY . /usr/src/app

# build
RUN yarn build
EXPOSE 8000

# run app
CMD "yarn" "dev" "--port" "8000"