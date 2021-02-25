## Nectar

### Development

```bash
# install dependencies
yarn bootstrap

# development
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
