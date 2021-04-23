## Nectar

### Getting started

install project dependencies
```bash
$ yarn install
```

bootstrap the project packages
```bash
$ yarn bootstrap
```

### Development

In one terminal, start the file watching for changes (hot reloading)
```bash
$ yarn dev
```

In a second termain, start the development server
```bash
$ yarn serve
```

### Production build

build assets
```bash 
$ yarn build
```

start production server
```bash
$ yarn start
```

### Usage with Docker

build docker image
```bash
$ docker build -t nectar .
```

start production server inside container
```bash
$ docker run -it -p 8000:8000 nectar
```

### Installing new dependencies (per package)

To install a new dependency globally
```bash
$ yarn add -W react
```

To install a dependency within a particular package
```bash
# lerna add <npm-package> --scope @nectar/<package>
$ lerna add react --scope @nectar/frontend
```
