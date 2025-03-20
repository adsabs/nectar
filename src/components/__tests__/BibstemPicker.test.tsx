import { render } from '@/test-utils';
import { expect, test } from 'vitest';
import { BibstemPicker } from '@/components/BibstemPicker';

test('Renders Single-version without error', () => {
  expect(() => render(<BibstemPicker />)).not.toThrow();
});

test('Renders Multi-version without error', () => {
  expect(() => render(<BibstemPicker multiple={true} />)).to.not.throw();
});
