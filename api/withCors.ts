import Cors from 'cors';
import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

const cors = Cors({
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'X-Access-Token',
  ],
  origin: 'localhost',
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
});

const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (req: any, res: any, fn: (result: any) => void) => void
) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
};

const withCors = (handler: NextApiHandler): NextApiHandler => {
  return async (req, res) => {
    await runMiddleware(req, res, cors);
    return handler(req, res);
  };
};

export default withCors;
