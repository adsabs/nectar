import { describe, expect, test } from 'vitest';
import { normalizeFields } from '../utils';
import { queryFields } from '@/api/search/types';

describe('normalizeFields', () => {
  const cases: [string, Parameters<typeof normalizeFields>, ReturnType<typeof normalizeFields>][] = [
    ['undefined', [undefined], undefined],
    ['empty query', [''], ''],
    ['no fields', ['foo bar'], 'foo bar'],
    ...queryFields.map(
      (f) =>
        [`field: ${f}`, [`${f}:value`], `${f}:value`] as [
          string,
          Parameters<typeof normalizeFields>,
          ReturnType<typeof normalizeFields>,
        ],
    ),
    ['unknown field left as is', ['uNknown:value PUB:foo'], 'uNknown:value pub:foo'],
  ];

  test.concurrent.each(cases)('%s', (_, args, expected) => {
    const result = normalizeFields(...args);
    expect(result).toEqual(expected);
  });
});
