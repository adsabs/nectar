import { config } from 'dotenv';
import express, { Request, Response } from 'express';
import { resolve } from 'path';
import app from './app';
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
