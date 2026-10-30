export interface ClientIp {
  ip: string;
  trusted: boolean;
}

const FALLBACK_HEADERS = ['X-Original-Forwarded-For', 'X-Forwarded-For', 'X-Real-Ip'];

interface HeaderReader {
  get: (name: string) => string | null;
}

export const resolveClientIp = (headers: HeaderReader): ClientIp => {
  const trustedHeader = process.env.TRUSTED_CLIENT_IP_HEADER;

  if (trustedHeader) {
    const value = headers.get(trustedHeader)?.split(',')[0]?.trim();
    if (value) {
      return { ip: value, trusted: true };
    }
  }

  for (const header of FALLBACK_HEADERS) {
    const value = headers.get(header)?.split(',')[0]?.trim();
    if (value) {
      return { ip: value, trusted: false };
    }
  }

  return { ip: 'unknown', trusted: false };
};
