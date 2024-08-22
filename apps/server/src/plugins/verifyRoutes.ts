import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const verifyRoutes: FastifyPluginCallback = async (server) => {
  server.route({
    method: 'POST',
    url: '/verify',
    handler: async (request, reply) => {
      const { token } = request.body as { token: string };
      // Your token verification logic goes here
      return { message: `Token verification for token: ${token}` };
    },
  });

  server.route({
    method: 'GET',
    url: '/verify/:code',
    handler: async (request, reply) => {
      const { code } = request.params as { code: string };
      // Your code verification logic goes here
      return { message: `Verification code: ${code}` };
    },
  });
};

export default fp(verifyRoutes, {
  name: 'verifyRoutes',
  dependencies: ['auth'], // Add dependencies as needed
});
