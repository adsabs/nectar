import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import loginRoute from '../routes/login';
import sessionRoute from '../routes/session';

const routes: FastifyPluginCallback = async (server) => {
  await server.register(sessionRoute);
  await server.register(loginRoute);
};

export default fp(routes, {
  name: 'routes',
  dependencies: ['cache'],
});
