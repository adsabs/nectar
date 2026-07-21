import { expect, test } from 'vitest';
import { getAbstractParams } from '../models';

test('getAbstractParams queries the scix_id field for a scix-shaped id', () => {
  expect(getAbstractParams('scix:6NEE-CD2G-T0JE').q).toBe('scix_id:"scix:6NEE-CD2G-T0JE"');
});

test('getAbstractParams queries the identifier field for a bibcode', () => {
  expect(getAbstractParams('1996PhRvL..77.3865P').q).toBe('identifier:"1996PhRvL..77.3865P"');
});

test('getAbstractParams requests scix_id in fl', () => {
  expect(getAbstractParams('1996PhRvL..77.3865P').fl).toContain('scix_id');
});
