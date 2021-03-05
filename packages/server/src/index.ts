import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import expressPinoLogger from 'express-pino-logger';
import { resolve } from 'path';
import { app } from './app';
import { logger } from './middlewares/logger';
config({
  path: resolve(__dirname, '../../../.env'),
});
const handle = app.getRequestHandler();
const port = process.env.PORT || 8080;

(async () => {
  try {
    await app.prepare();

    const server = express();
    server.use(express.urlencoded({ extended: true }));
    server.set('trust proxy', 1);

    // apply middlewares
    server.use(expressPinoLogger({ logger }));

    server.all('*', (req: Request, res: Response) => async () =>
      await handle(req, res),
    );
    server.listen(port, (err?: unknown) => {
      if (err) throw err;
      console.log(
        `> Ready on localhost:${port} - env ${process.env.NODE_ENV ??
          'development'}`,
      );
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
