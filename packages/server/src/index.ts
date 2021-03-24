import express, { Request, Response } from 'express';
import expressPinoLogger from 'express-pino-logger';
import next from 'next';
import path from 'path';
import { logger, session } from './middlewares';

const dev = process.env.NODE_ENV !== 'production';
const dir = path.resolve(__dirname, '../../frontend');
const app = next({ dev, dir });
const handle = app.getRequestHandler();
const port = process.env.PORT || 8000;

(async () => {
  try {
    await app.prepare();
    const server = express();

    server.use(express.urlencoded({ extended: true }));
    server.set('trust proxy', 1);

    // apply middlewares
    server.use(
      expressPinoLogger({
        logger,
      }),
    );
    server.use(session);
    // server.use(api);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    server.all('*', (req: Request, res: Response) => handle(req, res));

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
