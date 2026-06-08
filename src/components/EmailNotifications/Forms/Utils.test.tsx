import { describe, expect, test } from 'vitest';

import { isValidKeyword } from './Utils';

describe('isValidKeyword', () => {
  test.each([
    ['', true],
    ['plain keyword', true],
    ['(', false],
    [')', false],
    ['[', false],
    [']', false],
    ['{', false],
    ['}', false],
  ])('returns %s for single or empty input: %s', (keyword, expected) => {
    expect(isValidKeyword(keyword)).toBe(expected);
  });

  test.each([
    ['alpha (beta)', true],
    ['alpha [beta]', true],
    ['alpha (beta [gamma])', true],
    ['alpha [beta (gamma)]', true],
    ['([[]])', true],
    ['([])[]', true],
  ])('accepts balanced parentheses and brackets: %s', (keyword, expected) => {
    expect(isValidKeyword(keyword)).toBe(expected);
  });

  test.each([
    ['alpha (beta', false],
    ['alpha beta)', false],
    ['alpha [beta', false],
    ['alpha beta]', false],
    ['([)]', false],
    ['[(])', false],
    ['(]', false],
    ['[)', false],
    ['([)', false],
  ])('rejects unbalanced or mismatched parentheses and brackets: %s', (keyword, expected) => {
    expect(isValidKeyword(keyword)).toBe(expected);
  });

  test.each([
    ['{}', false],
    ['alpha {beta}', false],
    ['({})', false],
    ['[{}]', false],
    ['alpha } beta', false],
  ])('matches the current curly brace behavior in the implementation: %s', (keyword, expected) => {
    expect(isValidKeyword(keyword)).toBe(expected);
  });
});
