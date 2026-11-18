import { render } from '@/test-utils';
import { expect, test, vi } from 'vitest';
import { IDocsEntity } from '@/api/search/types';

vi.mock('next/router', () => ({
  useRouter: () => ({ query: {}, asPath: '/search', pathname: '/search', push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('better-react-mathjax', () => ({
  MathJax: ({ children, ...props }: { children?: unknown }) => (
    <span data-testid="mathjax" {...props}>
      {children as never}
    </span>
  ),
}));

import { Item } from './Item';

const docWithTitle = (title: string): IDocsEntity =>
  ({ bibcode: '2024Test0001.0001X', title: [title], author: [] } as IDocsEntity);

const renderItem = (title: string) => render(<Item doc={docWithTitle(title)} index={1} hideCheckbox hideActions />);

test('a title containing math is typeset', () => {
  const { queryAllByTestId } = renderItem('The mass of $M_\\odot$ stars');

  expect(queryAllByTestId('mathjax').length).toBeGreaterThan(0);
});

test('a title with no math is not handed to MathJax at all', () => {
  const { queryAllByTestId, getByTestId } = renderItem('A Catalogue of Nearby Stars');

  expect(queryAllByTestId('mathjax')).toHaveLength(0);
  expect(getByTestId('result-title')).toHaveTextContent('A Catalogue of Nearby Stars');
});

test('markup in a title survives when MathJax is skipped', () => {
  const { getByTestId } = renderItem('Detection of H<SUB>2</SUB>O in a disk');

  expect(getByTestId('result-title').innerHTML).toContain('<sub>2</sub>');
});
