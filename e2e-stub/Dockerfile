FROM node:18-alpine

# Install wget for healthchecks
RUN apk add --no-cache wget

WORKDIR /app

# Install express
RUN npm install express

COPY server.js .

EXPOSE 18080

CMD ["node", "server.js"]
