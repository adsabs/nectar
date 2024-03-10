## Nectar

### Getting started

#### Dependencies

Install the project dependencies:

```bash
pnpm install
```

#### Development

Start the development server:

```bash
pnpm dev
```

Run tests:

```bash
pnpm test
```

Run integration tests

```bash
pnpm integration
```

Run storybook:

```bash
pnpm storybook
```

#### Production build

Build the docker image:

```bash
docker build -t nectar .
```

To make a production build locally, you can run:

```bash
pnpm run build:local
```

#### Production

Start the production server inside a container:

```bash
docker run -it --rm --name nectar -p 8000:8000 -p 6006:6006 nectar
```

Start the local production server

```bash
pnpm run start:local
```

#### Development

Create a container mounting the current directory in the `/app/` and start a `bash` shell to run any desired commands:

```bash
docker run -it --rm --name nectar -p 8000:8000 -p 6006:6006 -v $PWD:/app/ nectar bash
```

#### Bundle Analysis

This should open the results in a browser to see the generated bundles:

```bash
pnpm run analyze
```

#### Docker

We can run both the production and the development server on Docker.

```bash
pnpm run docker:dev
pnpm run docker:prod
```

Run the integration tests:
```bash
pnpm run docker:integration

# Runs the playwright UI server
pnpm run docker:integration:ui
```

Run the unit tests:
```bash
pnpm run docker:unit
```
