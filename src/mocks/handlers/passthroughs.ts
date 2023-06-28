import { rest } from 'msw';

export const passthroughs = [
  rest.all('/_next/*', (req) => req.passthrough()),
  rest.all('__next*', (req) => req.passthrough()),
  rest.get('/site.webmanifest', (req, res, ctx) => req.passthrough()),
  rest.get('/favicon*', (req, res, ctx) => req.passthrough()),
];
