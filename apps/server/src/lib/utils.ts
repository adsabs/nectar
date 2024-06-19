import stringify from 'json-stringify-safe';
import { pipeline as pipelineCB, Readable, Writable } from 'stream';
import { promisify } from 'util';

import { BootstrapResponse, NectarUserData, ScixSession, ScixUser, sessionResponseSchema } from '../types';

/**
 * Picks the specified properties from an object.
 * @param keys - An array of keys to pick from the object.
 * @param obj - The source object to pick properties from.
 * @returns A new object with only the specified properties.
 */
export function pick<T extends object, K extends keyof T>(keys: K[], obj: T): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Get the first set-cookie header from the headers object.
 * @param header - The set-cookie header or an array of set-cookie headers.
 * @returns The first set-cookie header.
 */
export function unwrapHeader(header: Array<string> | string): string {
  return Array.isArray(header) ? header[0] : header;
}

/**
 * Checks if the user data is valid.
 *
 * @param {ScixSession} session
 * @returns {boolean} - True if the session is valid, false otherwise.
 */
export const isSessionValid = (session: NectarUserData): session is NectarUserData => {
  if (sessionResponseSchema.validateSync(session)) {
    // Considering the token expired if within 1 minute of expiration time
    const expiresAtTimestamp = parseInt(session.user.expire, 10) * 1000;
    return expiresAtTimestamp - Date.now() >= 60 * 1000;
  }
};

/**
 * Stringifies an object to a JSON string.
 *
 * @param {any} obj - The object to stringify.
 * @returns {string} - The JSON string representation of the object.
 */
export const stringifyJSON = stringify;

const pipeline = promisify(pipelineCB);

/**
 * Consumes a readable stream and returns its content as a string.
 *
 * @param {Readable} readableStream - The readable stream to consume.
 * @returns {Promise<string>} - A promise that resolves to the content of the stream as a string.
 */
export const consumeReadableStream = async (readableStream: Readable): Promise<string> => {
  let data = '';

  // Create a writable stream to collect data
  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      data += chunk.toString();
      callback();
    },
  });

  // Use pipeline to handle the stream
  void (await pipeline(readableStream, writableStream));

  return data;
};

interface ParsedTraceId {
  Root?: string;
  Parent?: string;
  Sampled?: string;
}

export const parseTraceId = (traceId: string): ParsedTraceId => {
  const parts = traceId.split(';');
  const parsed: ParsedTraceId = {};

  parts.forEach((part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      parsed[key.trim() as keyof ParsedTraceId] = value.trim();
    }
  });

  return parsed;
};

export const bootstrapResponseToUser = (response: BootstrapResponse): ScixUser => ({
  name: response.username,
  expire: response.expires_at,
  anonymous: response.anonymous,
  token: response.access_token,
});

export const noop = <T = unknown>(props?: T) => {
  return props;
};

const excludePathsRegex = /^\/(_next|v1|api)\/.+$/;
export const skipUrl = (url: string) => excludePathsRegex.test(url);
