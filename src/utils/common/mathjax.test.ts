import { expect, test } from 'vitest';
import { containsMath } from './mathjax';

test.each([
  ['inline dollar math', 'The mass of $M_\\odot$ stars'],
  ['display dollar math', 'Results $$E = mc^2$$ follow'],
  ['inline paren math', 'A value of \\(x\\) was used'],
  ['display bracket math', 'Given \\[y = 2x\\] we see'],
])('%s is routed through MathJax', (_label, title) => {
  expect(containsMath(title)).toBe(true);
});

test.each([
  ['plain prose', 'A Catalogue of Nearby Stars'],
  ['html markup only', 'Detection of H<SUB>2</SUB>O in a protoplanetary disk'],
  ['escaped backslash without a delimiter', 'Path C\\temp and more'],
])('%s is not routed through MathJax', (_label, title) => {
  expect(containsMath(title)).toBe(false);
});

test('a missing title is not math', () => {
  expect(containsMath(undefined)).toBe(false);
  expect(containsMath(null)).toBe(false);
  expect(containsMath('')).toBe(false);
});
