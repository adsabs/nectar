from node:12

RUN apt-get update \
    apt-get install -y git

RUN mkdir /workspaces/nectar \
    cd /workspaces \
    git clone https://github.com/adsabs/Nectar.git nectar

WORKDIR /workspaces/nectar