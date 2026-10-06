import { describe, expect, test } from 'vitest';

import { render } from '@/test-utils';
import { IDocsEntity } from '@/api/search/types';
import { Item } from './Item';
import {
  RESULT_ITEM_ABSTRACT_TOGGLE_HEIGHT,
  RESULT_ITEM_HEIGHT,
  RESULT_ITEM_TITLE_LINES,
} from '@/components/ResultList/itemHeight';

const doc = {
  bibcode: '2024TestA....1....1X',
  title: ['A title long enough that it would wrap past two lines in a narrow result column'],
  author: ['Smith, J.', 'Jones, A.'],
  author_count: 2,
  pubdate: '2024-05-00',
  pub: 'Journal of Testing',
  volume: '12',
  page: ['34'],
} as unknown as IDocsEntity;

const renderItem = (overrides: Partial<IDocsEntity> = {}) =>
  render(<Item doc={{ ...doc, ...overrides }} index={1} hideCheckbox={false} hideActions={false} />);

const titleCss = (container: HTMLElement): string => {
  const title = container.querySelector('.article-title > span') as HTMLElement;
  const classes = [...title.classList].map((c) => `.${c}`);
  return [...document.querySelectorAll('style')]
    .flatMap((style) => (style.textContent ?? '').split('}'))
    .filter((rule) => classes.some((c) => rule.includes(c)))
    .join('}');
};

describe('Item geometry', () => {
  test('reserves a fixed card height so the skeleton and the loaded card agree', () => {
    const { container } = renderItem();

    expect(container.querySelector('article')).toHaveStyle({ minHeight: RESULT_ITEM_HEIGHT.base });
  });

  test('clamps the title so a long one cannot grow the card', () => {
    const { container } = renderItem();

    expect(titleCss(container)).toContain(`--chakra-line-clamp:${RESULT_ITEM_TITLE_LINES}`);
  });

  test('forces the clamp past the inline display MathJax sets on the title', () => {
    const { container } = renderItem();

    const title = container.querySelector('.article-title > span') as HTMLElement;
    expect(title.style.display).toBe('block');
    expect(titleCss(container)).toContain('display:-webkit-box!important');
  });

  test('reserves the abstract toggle row, which loads only on the client', () => {
    const { getByTestId } = renderItem();

    expect(getByTestId('abstract-preview-slot')).toHaveStyle({ minHeight: RESULT_ITEM_ABSTRACT_TOGGLE_HEIGHT });
  });

  test('keeps the card height when a document has no volume or page', () => {
    const { container } = renderItem({ volume: undefined, page: undefined });

    expect(container.querySelector('article')).toHaveStyle({ minHeight: RESULT_ITEM_HEIGHT.base });
  });
});
