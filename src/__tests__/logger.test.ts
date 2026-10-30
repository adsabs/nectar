import { describe, expect, test } from 'vitest';
import pino from 'pino';

import { REDACTED_LOG_PATHS } from '@/logger';

const captured = () => {
  const lines: string[] = [];
  const log = pino(
    { level: 'debug', redact: REDACTED_LOG_PATHS, enabled: true },
    { write: (line: string) => lines.push(line) },
  );
  return { log, lines };
};

describe('REDACTED_LOG_PATHS', () => {
  test.each([
    ['at the top level', { access_token: 'secret-token' }],
    ['one level down', { token: { access_token: 'secret-token' } }],
    ['two levels down', { session: { token: { access_token: 'secret-token' } } }],
    ['three levels down', { props: { session: { token: { access_token: 'secret-token' } } } }],
  ])('redacts an access token %s', (_name, payload) => {
    const { log, lines } = captured();

    log.debug(payload, 'test');

    expect(lines.join('')).not.toContain('secret-token');
    expect(lines.join('')).toContain('[Redacted]');
  });

  test('leaves other fields intact', () => {
    const { log, lines } = captured();

    log.debug({ token: { access_token: 'secret-token', username: 'anonymous' } }, 'test');

    expect(lines.join('')).toContain('anonymous');
  });
});
