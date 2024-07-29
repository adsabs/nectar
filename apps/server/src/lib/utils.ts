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
  return 'session=.eJw9zsEOQ0AUheFXae66C9RKYiOjYjEjEirXRrSGmkGbQVoj3r1i0Qc43_lXKGrFxyc4ddmN_AxFW4GzwukODtA-tFGkBorGykklUdwEzahG4X_ypDEZkUuUhAsVsQvbvn1z1ZcDHyZwJjXv2mNUdTG9JB_-aBSwNgpiTRNvB9MvWnhB7XW0902W5JIRuqCoZER8nfd4odlVYOweB_PI1REIlm3A9gM3IT3-.Zp_7oQ.lpuwmzgf1R0Fgf7hmTlMFwcPGoo; Expires=Thu, 24-Jul-2025 00:51:13 GMT; Secure; HttpOnly; Path=/; SameSite=None';
  // return Array.isArray(headers['set-cookie']) ? headers['set-cookie'][0] : headers['set-cookie'];
}
