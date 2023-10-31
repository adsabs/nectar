## Nectar

### Getting started

#### Dependencies

Install `pnpm` and [the current long term support version of nodejs](https://github.com/nodejs/Release). If you want `pnpm` to manage `node` versions for you, use the standalone installer script.

Install the project dependencies:

```bash
pnpm install 
```

#### Development

Be sure to set the following environment variables prior to starting the development server:
- `COOKIE_SECRET`, should be at least 32 characters long
- `ADS_SESSION_COOKIE_NAME`
- `SCIX_SESSION_COOKIE_NAME`

Then you can start the development server with mock API endpoints:

```bash
pnpm dev:mocks
```

Or, run the development server against live APIs:

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

