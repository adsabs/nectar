import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { Agent, Dispatcher, request as undiciRequest } from 'undici';
import { IncomingHttpHeaders } from 'undici/types/header.js';

import { apiTargets } from '../lib/api.js';

const dispatcher = new Agent({
  connectTimeout: 30_000,
  bodyTimeout: 30_000,
  headersTimeout: 30_000,
});

export interface RequestOptions extends Dispatcher.RequestOptions {
  path: keyof typeof apiTargets;
  signal?: AbortSignal;
}

export type Fetcher = <TBody = unknown>(
  options: RequestOptions,
) => Promise<{ body: TBody; headers: IncomingHttpHeaders; statusCode: number }>;

const requestPlugin: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  const fetcher = async <TBody = unknown>({ path, signal, ...rest }: RequestOptions) => {
    try {
      const url = `${fastify.config.API_HOST_SERVER}${apiTargets[path]}`;
      const res = await undiciRequest(url, { signal, dispatcher, throwOnError: true, ...rest });
      const json = (await res.body.json()) as TBody;
      return {
        statusCode: res.statusCode,
        headers: res.headers,
        body: json,
      };
    } catch (e) {
      fastify.log.error({ msg: 'Error during fetch', error: e });
      throw e;
    }
  };

  fastify.decorate('fetcher', fetcher);
  done();
};

export default fp(requestPlugin, { name: 'request', dependencies: ['cache'] });
