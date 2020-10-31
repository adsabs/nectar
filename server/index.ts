import cookieSession from 'cookie-session';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import next from 'next';
import apiMiddleware from './apiMiddleware';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 8000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 100 requests per windowMs
  skip: (req) => {
    console.log('session', req.cookies, req.session);
    return !!req.session;
  },
});

(async () => {
  try {
    await app.prepare();
    const server = express();
    server.use(express.urlencoded({ extended: true }));
    server.set('trust proxy', 1);
    server.use('/api/', limiter);

    server.use(
      cookieSession({
        name: 'nectar_session',
        keys: [process.env.COOKIE_SECRET || ''],
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: false,
      })
    );

    server.use(morgan('short'));
    server.use(apiMiddleware());

    server.all('*', (req: Request, res: Response) => {
      console.log('--->', req.originalUrl);
      return handle(req, res);
    });
    server.listen(port, (err?: any) => {
      if (err) throw err;
      console.log(`> Ready on localhost:${port} - env ${process.env.NODE_ENV}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
