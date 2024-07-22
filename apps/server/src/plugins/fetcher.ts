import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { Agent, Dispatcher, errors, request as undiciRequest } from 'undici';
import { IncomingHttpHeaders } from 'undici/types/header';

import { apiTargets } from '../lib/api';

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

const requestPlugin: FastifyPluginCallback = (server: FastifyInstance, _opts, done) => {
  const fetcher = async <TBody = unknown>({ path, signal, headers = {}, ...rest }: RequestOptions) => {
    // set the default content type to JSON
    headers['Content-Type'] = 'application/json';

    try {
      const url = `${server.config.API_HOST_SERVER}${apiTargets[path]}`;
      const res = await undiciRequest(url, { signal, dispatcher, throwOnError: true, headers, ...rest });
      const json = (await res.body.json()) as TBody;
      return {
        body: json,
        ...res,
      };
    } catch (e) {
      server.log.error({ msg: 'Error during fetch', error: e as errors.UndiciError });
      throw e;
    }
  };

  server.decorate('fetcher', fetcher);
  done();
};

export default fp(requestPlugin, { name: 'request', dependencies: ['cache'] });
