import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { OutgoingHttpHeaders } from 'http';
import { AbortController } from 'next/dist/compiled/@edge-runtime/primitives';
import { Agent, Dispatcher, errors, request as undiciRequest, RetryAgent } from 'undici';

import { apiTargets, getApiEndpoint } from '../lib/api';

/**
 * Interface defining the structure of the request options for the fetcher function.
 */
export interface RequestOptions extends Dispatcher.RequestOptions {
  url?: string;
  path: keyof typeof apiTargets;
  payload?: Record<string, unknown>;
}

/**
 * Type defining the structure of the fetcher's response.
 */
export type FetcherResponse<TBody = unknown> = {
  body: TBody & { rawResponse?: string };
  headers: OutgoingHttpHeaders;
  statusCode: number;
};

/**
 * Type for the fetcher function, returning a promise of FetcherResponse.
 */
export type FetcherFn = <TBody = unknown>(options: RequestOptions) => Promise<FetcherResponse<TBody>>;

/**
 * Fastify plugin to add the fetcher and bootstrapToken functions to the Fastify instance.
 */
const requestPlugin: FastifyPluginCallback = (server: FastifyInstance, _opts, done) => {
  // Track ongoing requests for cancellation.
  const ongoingRequests: Record<string, AbortController> = {};

  // Create a RetryAgent with retry logic.
  const retryAgent = new RetryAgent(
    new Agent({
      connectTimeout: 30_000,
      connections: 16,
      pipelining: 8,
      keepAliveTimeout: 60_000,
      connect: {
        rejectUnauthorized: server.config.NODE_ENV === 'production',
      },
    }),
    { maxRetries: 3, minTimeout: 1000 },
  );

  // Fetcher function to handle HTTP requests.
  const fetcher: FetcherFn = async <TBody = unknown>({
    path,
    headers = {},
    payload,
    ...rest
  }: RequestOptions): Promise<FetcherResponse<TBody>> => {
    const requestKey = `${rest.method}${path}`;

    server.log.info({ msg: 'Fetching', path, headers, payload, ...rest });

    // Abort ongoing request with the same key.
    if (ongoingRequests[requestKey]) {
      server.log.debug({ msg: 'Found matching request, aborting previous' });
      ongoingRequests[requestKey].abort();
      delete ongoingRequests[requestKey];
    }

    const controller = new AbortController();
    ongoingRequests[requestKey] = controller;

    // Set host header for non-production environments to avoid CORS issues.
    if (server.config.NODE_ENV !== 'production') {
      headers['host'] = server.config.API_BASE_DOMAIN_SERVER;
    }

    // Serialize payload if provided.
    let body = '';
    if (payload) {
      body = JSON.stringify(payload);
      headers['content-length'] = Buffer.byteLength(body, 'utf8').toString();
    }

    try {
      const url = `${server.config.API_HOST_SERVER}${rest.url ? rest.url : getApiEndpoint(path)}`;

      const res = await undiciRequest(url, {
        ...rest,
        signal: controller.signal,
        dispatcher: retryAgent,
        headers: {
          'content-type': 'application/json',
          ...headers,
        },
        body,
        throwOnError: false,
      });

      const rawBody = await res.body.text();

      server.log.info({
        msg: 'Received a response',
        status: res.statusCode,
        headers: res.headers,
      });

      let json: TBody;
      try {
        json = JSON.parse(rawBody) as TBody;
      } catch (jsonParseError) {
        server.log.error({
          msg: 'Failed to parse response body as JSON',
          err: jsonParseError,
          url,
        });
        json = {
          rawResponse: rawBody,
        } as TBody;
      }

      return {
        body: json,
        headers: res.headers,
        statusCode: res.statusCode,
      };
    } catch (error) {
      server.log.error({
        msg: 'Error during fetch',
        err: error as FetcherError,
      });
      throw error as FetcherError;
    } finally {
      // Clean up the ongoingRequests record.
      delete ongoingRequests[requestKey];
    }
  };

  // Decorate the Fastify server instance with the fetcher method.
  server.decorate('fetcher', fetcher);
  done();
};

export default fp(requestPlugin, { name: 'fetcher', dependencies: ['cache'] });

export type FetcherError = errors.UndiciError;
