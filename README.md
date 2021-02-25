## Nectar

### Development

```bash
# install dependencies
yarn bootstrap

# development, watches for changes (hot reload)
yarn dev

# production build
yarn build

# production server
yarn start

# testing
yarn test
```

### Docker

```bash
# build image
docker build -t nectar .

# start produuction server
docker run -it -p 8000:8000 nectar
```

### Installing new dependencies

```bash
# should use lerna to install deps
# lerna add <npm-package> --scope @nectar/<package>
lerna add react --scope @nectar/frontend
```
