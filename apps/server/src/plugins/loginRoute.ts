import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const loginRoute: FastifyPluginCallback = async (server) => {
  server.route({
    method: 'POST',
    url: '/login',
    handler: async (request, reply) => {
      const { username, password } = request.body as { username: string; password: string };
      // Your login logic goes here
      return { message: `Logged in as ${username}` };
    },
  });
};

export default fp(loginRoute, {
  name: 'loginRoute',
  dependencies: ['session', 'auth'], // Add dependencies as needed
});
