import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { OutgoingHttpHeaders } from 'http';
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
  // Create a RetryAgent with retry logic and connection pooling.
  const retryAgent = new RetryAgent(
    new Agent({
      connectTimeout: 60_000,
      connections: 128,
      pipelining: 2,
      keepAliveTimeout: 60_000,
      keepAliveMaxTimeout: 2 * 60_000,
      connect: {
        rejectUnauthorized: server.config.NODE_ENV === 'production',
        keepAlive: true,
      },
    }),
    { maxRetries: 3, minTimeout: 1000, statusCodes: [500, 502, 503, 504] },
  );

  // Fetcher function to handle HTTP requests.
  const fetcher: FetcherFn = async <TBody = unknown>({
    path,
    headers = {},
    payload,
    ...rest
  }: RequestOptions): Promise<FetcherResponse<TBody>> => {
    const requestKey = `${rest.method}${path}${JSON.stringify(rest.query)}`;
    const debounceTime = 300; // Debounce period in milliseconds
    const controller = new AbortController();
    const ongoingRequests: Record<
      string,
      {
        controller: AbortController;
        promise: Promise<FetcherResponse<TBody>>;
        timeoutId: NodeJS.Timeout;
      }
    > = {};

    server.log.info({ msg: 'Fetching', path, headers, payload, ...rest });

    // If there's an ongoing request with the same key, return its result
    if (ongoingRequests[requestKey]) {
      server.log.debug({
        msg: 'Found matching request, returning existing response',
      });
      return ongoingRequests[requestKey].promise;
    }

    // Set up the controller and store the placeholder for the promise
    ongoingRequests[requestKey] = {
      controller,
      promise: null,
      timeoutId: null, // For debouncing
    };

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

    // Debounce logic
    const debouncePromise = new Promise<FetcherResponse<TBody>>((resolve, reject) => {
      ongoingRequests[requestKey].timeoutId = setTimeout(async () => {
        try {
          const url = `${server.config.API_HOST_SERVER}${server.config.API_PREFIX}${
            rest.url ? rest.url : getApiEndpoint(path)
          }`;

          const res = await undiciRequest(url, {
            ...rest,
            signal: controller.signal,
            dispatcher: retryAgent,
            headers: {
              'content-type': 'application/json',
              ...headers,
            },
            body,
            throwOnError: true,
          });

          if (controller.signal.aborted) {
            server.log.debug({
              msg: 'Request was aborted',
              url,
            });
            throw new errors.RequestAbortedError('Request was aborted');
          }

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

          // Resolve the promise with the successful response
          resolve({
            body: json,
            headers: res.headers,
            statusCode: res.statusCode,
          });
        } catch (error) {
          if (error.name === 'AbortError') {
            server.log.debug({
              msg: 'Request was aborted',
              url: `${rest.url || getApiEndpoint(path)}`,
            });
            resolve({
              body: null,
              headers: {},
              statusCode: 499,
            });
          } else {
            server.log.error({
              msg: 'Error during fetch',
              err: error as FetcherError,
              url: `${rest.url || getApiEndpoint(path)}`,
            });
            reject(error as FetcherError);
          }
        } finally {
          // Clean up the ongoingRequests record safely.
          clearTimeout(ongoingRequests[requestKey].timeoutId);
          if (ongoingRequests[requestKey].controller === controller) {
            delete ongoingRequests[requestKey];
          }
        }
      }, debounceTime);
    });

    // Store the promise in the ongoingRequests so that other requests can share it
    ongoingRequests[requestKey].promise = debouncePromise;

    return debouncePromise;
  };

  // Decorate the Fastify server instance with the fetcher method.
  server.decorate('fetcher', fetcher);

  done();
};

export default fp(requestPlugin, { name: 'fetcher', dependencies: ['cache'] });

export type FetcherError = errors.ResponseStatusCodeError;
