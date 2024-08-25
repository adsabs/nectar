import { FastifyPluginCallbackTypebox } from '@fastify/type-provider-typebox';

export const nextjsRoute: FastifyPluginCallbackTypebox = async (server) => {
  server.route({
    url: '/*',
    method: ['GET', 'POST', 'PUT', 'HEAD'],
    handler: async (request, reply) => {
      server.log.debug({
        msg: 'Processing Next.js request...',
        url: request.url,
      });

      server.log.debug({
        auth: request.auth,
      });

      await server.nextAppContext.getRequestHandler()(request.raw, reply.raw);
    },
  });
  return server;
};
