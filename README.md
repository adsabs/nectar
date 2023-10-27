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

#### Production

Start the production server inside a container:

```bash
docker run -it --rm --name nectar -p 8000:8000 -p 6006:6006 nectar 
```

#### Development

Create a container mounting the current directory in the `/app/` and start a `bash` shell to run any desired commands:

```bash
docker run -it --rm --name nectar -p 8000:8000 -p 6006:6006 -v $PWD:/app/ nectar bash
```

