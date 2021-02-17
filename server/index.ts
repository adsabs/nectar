import express, { Request, Response } from 'express';
import expressPinoLogger from 'express-pino-logger';
import app from './app';
import api from './middlewares/api';
import cookieSession from './middlewares/cookieSession';
import errorHandler from './middlewares/errorHandler';
import logger from './middlewares/logger';
import rateLimit from './middlewares/rateLimiter';

const handle = app.getRequestHandler();
const port = process.env.PORT || 8000;

(async () => {
  try {
    await app.prepare();
    const server = express();
    server.use(express.urlencoded({ extended: true }));
    server.set('trust proxy', 1);

    // apply middlewares
    server.use('/api/', rateLimit);
    server.use(cookieSession);
    server.use(expressPinoLogger({ logger }));
    server.use(errorHandler);
    server.use(api);

    server.all('*', (req: Request, res: Response) => handle(req, res));
    server.listen(port, (err?: any) => {
      if (err) throw err;
      console.log(`> Ready on localhost:${port} - env ${process.env.NODE_ENV}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
