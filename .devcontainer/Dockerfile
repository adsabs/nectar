ARG VARIANT="14"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

# install ts-node
RUN yarn global add ts-node

# cypress dependencies (https://docs.cypress.io/guides/guides/continuous-integration.html#Advanced-setup)
RUN apt-get update && apt-get install -y \ 
  libgtk2.0-0 \
  libgtk-3-0 \
  libgbm-dev \
  libnotify-dev \
  libgconf-2-4 \
  libnss3 \
  libxss1 \
  libasound2 \
  libxtst6 \
  xauth \
  xvfb

# Install doppler during build phase
RUN (curl -Ls https://cli.doppler.com/install.sh || wget -qO- https://cli.doppler.com/install.sh) | sh
