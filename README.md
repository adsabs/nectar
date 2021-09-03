## Nectar

### Getting started

#### NodeJS

Install the JavaScript Tool Manager [Volta](https://volta.sh/):

```bash
curl https://get.volta.sh | bash
```

Volta gets installed in `$HOME/.volta/`, and it adds to `$HOME/.bashrc` the following lines:

```bash
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
```

Therefore, it will be necessary to close and open again the terminal or run:

```bash
source $HOME/.bashrc
```

Once this is done, anytime that we run `node` or `yarn` within nectar's directory, volta will kick in and read the `package.json` file, which can contain this definition:

```
"volta": {
  "node": "14.16.1",
  "yarn": "1.22.10"
}
```

Therefore, volta will automatically download/enable the node and yarn version specified in `package.json`.


#### Dependencies

Install the project dependencies:

```bash
yarn install --pure-lockfile
```

#### Development

Start the development server:

```bash
yarn dev
```

Run tests:

```bash
yarn test
```

Run storybook:

```bash
yarn storybook
```

To run cypress, start the production server in one terminal:

```bash
yarn start
```

And without closing it, open a new terminal and run cypress:

```bash
yarn cypress:run
```

#### Production build

Build the application:

```bash
yarn build
```

And start production server:

```bash
yarn start
```

### Usage with Docker

Build the docker image:

```bash
docker build -t nectar .
```

#### Production

Start the production server inside a container:

```bash
docker run -it --rm --name nectar -p 8000:8000 -p 6006:6006 nectar yarn start
```

#### Development

Create a container mounting the current directory in the `/app/` and start a `bash` shell to run any desired commands:

```bash
docker run -it --rm --name nectar -p 8000:8000 -p 6006:6006 -v $PWD:/app/ nectar bash
```

