from mcr.microsoft.com/vscode/devcontainers/typescript-node:0-$VARIANT

RUN mkdir /workspaces/nectar \
    cd /workspaces \
    git clone https://github.com/adsabs/Nectar.git nectar

WORKDIR /workspaces/nectar