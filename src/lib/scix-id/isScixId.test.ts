import { expect, test } from 'vitest';
import { isScixId } from './isScixId';

test('isScixId detects scix-prefixed ids', () => {
  expect(isScixId('scix:6NEE-CD2G-T0JE')).toBe(true);
});

test('isScixId rejects bibcodes, DOIs, and arXiv ids', () => {
  expect(isScixId('1996PhRvL..77.3865P')).toBe(false);
  expect(isScixId('10.1103/PhysRevLett.77.3865')).toBe(false);
  expect(isScixId('arXiv:2410.11100')).toBe(false);
});
