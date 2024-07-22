import { IncomingHttpHeaders } from 'undici/types/header';

/**
 * Picks the specified properties from an object.
 * @param keys - An array of keys to pick from the object.
 * @param obj - The source object to pick properties from.
 * @returns A new object with only the specified properties.
 */
export function pick<T extends object, K extends keyof T>(keys: K[], obj: T): Pick<T, K> {
  return keys.reduce((acc, key) => {
    if (key in obj) {
      acc[key] = obj[key];
    }
    return acc;
  }, {} as Pick<T, K>);
}

/**
 * Get the first set-cookie header from the headers object.
 * @param headers - The headers object.
 * @returns The first set-cookie header.
 */
export function getSetCookieHeader(headers: IncomingHttpHeaders): string | undefined {
  return Array.isArray(headers['set-cookie']) ? headers['set-cookie'][0] : headers['set-cookie'];
}
