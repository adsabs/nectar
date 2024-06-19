import { describe, expect, test } from 'vitest';

import { skipUrl } from '../utils';
describe('skipUrl', () => {
  const cases: [
    string,
    string, // The route to test
    boolean, // Expected result: true if it should match, false otherwise
  ][] = [
    ['matches /v1/something', '/v1/something', true],
    ['matches /v1/something.html', '/v1/something.html', true],
    ['matches /_next/file.js', '/_next/file.js', true],
    ['matches /api/data.json', '/api/data.json', true],
    ['does not match /v1', '/v1', false],
    ['does not match /_next', '/_next', false],
    ['does not match /api', '/api', false],
    ['does not match /another/path', '/another/path', false],
  ];

  test.concurrent.each(cases)('%s', (_, route, expected) => {
    const result = skipUrl(route);
    expect(result).toEqual(expected);
  });
});
