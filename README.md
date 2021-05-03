## Nectar

### Getting started

install project dependencies

```bash
$ yarn install
```

### Development

Start the development server

```bash
$ yarn dev
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
$ docker run --rm -it -p 8000:8000 nectar
```
