import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const detailsRoute: FastifyPluginCallback = async (server) => {
  server.route({
    method: 'GET',
    url: '/details/:id',
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      // Your details logic goes here
      return { message: `Details for ID: ${id}` };
    },
  });
};

export default fp(detailsRoute, {
  name: 'detailsRoute',
  dependencies: ['cache', 'fetcher'], // Add dependencies as needed
});
