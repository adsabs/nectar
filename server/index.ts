import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import next from 'next';
import { api, logger, session } from './middlewares';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 8000;

(async () => {
  try {
    await app.prepare();
    const server = express();

    server.use(express.urlencoded({ extended: true }));
    server.set('trust proxy', 1);
    server.use(cookieParser());
    server.use(bodyParser.json());

    // apply middlewares
    server.use(logger);
    server.use(session);
    server.use(api);

    server.all('*', (req: Request, res: Response) => {
      if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
        res.setHeader('Service-Worker-Allowed', '/');
      }
      void handle(req, res);
    });

    server.listen(port, (err?: unknown) => {
      if (err) {
        throw err;
      }

      console.log(`> Ready on http://localhost:${port} [${process.env.NODE_ENV ?? 'development'}]`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
