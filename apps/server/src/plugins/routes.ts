import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { searchRoute } from 'src/routes/search';

import { loginRoute } from '../routes/login';
import { nextjsRoute } from '../routes/nextjs';
import { sessionRoute } from '../routes/session';

const routes: FastifyPluginCallback = async (server) => {
  await server.register(sessionRoute);
  await server.register(loginRoute);
  await server.register(searchRoute);

  // catch-all route for Next.js
  await server.register(nextjsRoute);
};

export default fp(routes, {
  name: 'routes',
  dependencies: ['cache', 'fetcher'],
});
