import { describe, test } from 'vitest';
import { reconcileDocIdentifier } from '@/components/Orcid/helpers';

describe('reconcileDocIdentifier', () => {
  const cases: [string, Parameters<typeof reconcileDocIdentifier>, ReturnType<typeof reconcileDocIdentifier>][] = [
    ['bibcode present', [{ bibcode: '2024TestCode' }], '2024TestCode'],
    ['alternate_bibcode as an array', [{ alternate_bibcode: ['2024AltCode1', '2024AltCode2'] }], '2024AltCode1'],
    ['alternate_bibcode as a string', [{ alternate_bibcode: ['2024AltCode'] }], '2024AltCode'],
    ['identifier as an array', [{ identifier: ['2024IdCode1', '2024IdCode2'] }], '2024IdCode1'],
    ['identifier as a string', [{ identifier: ['2024IdCode'] }], '2024IdCode'],
    ['no identifier fields', [{}], null],
    [
      'all fields present',
      [{ bibcode: '2024TestCode', alternate_bibcode: ['2024AltCode1'], identifier: ['2024IdCode1'] }],
      '2024TestCode',
    ],
    [
      'alternate_bibcode and identifier present',
      [{ alternate_bibcode: ['2024AltCode'], identifier: ['2024IdCode'] }],
      '2024AltCode',
    ],
  ];

  test.concurrent.each(cases)('%s', (_, args, expected) => {
    const result = reconcileDocIdentifier(...args);
    expect(result).toEqual(expected);
  });
});
