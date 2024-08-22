import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const searchRoute: FastifyPluginCallback = async (server) => {
  server.route({
    method: 'GET',
    url: '/search',
    handler: async (request, reply) => {
      // Your search logic goes here
      return { message: 'Search route' };
    },
  });
};

export default fp(searchRoute, {
  name: 'searchRoute',
  dependencies: ['cache', 'fetcher'], // Add dependencies as needed
});
