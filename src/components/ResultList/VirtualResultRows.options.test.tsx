import { render } from '@/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { IDocsEntity } from '@/api/search/types';

interface IVirtualizerOptions {
  count: number;
  overscan: number;
  useFlushSync: boolean;
  estimateSize: () => number;
}

const mocks = vi.hoisted(() => ({
  useWindowVirtualizer: vi.fn<(options: IVirtualizerOptions) => unknown>(() => ({
    getTotalSize: (): number => 1000,
    getVirtualItems: (): unknown[] => [],
    measureElement: (): void => undefined,
    scrollToIndex: (): void => undefined,
  })),
}));

vi.mock('@tanstack/react-virtual', () => ({ useWindowVirtualizer: mocks.useWindowVirtualizer }));

import { VirtualResultRows } from './VirtualResultRows';

const docsFor = (count: number): IDocsEntity[] =>
  Array.from({ length: count }, (_, i) => ({ bibcode: `bib-${i}` } as IDocsEntity));

const renderRows = (count = 500) =>
  render(<VirtualResultRows docs={docsFor(count)} renderRow={(doc) => <div>{doc.bibcode}</div>} />);

const optionsPassed = (): IVirtualizerOptions => mocks.useWindowVirtualizer.mock.calls[0][0];

beforeEach(() => {
  mocks.useWindowVirtualizer.mockClear();
});

test('scroll updates stay interruptible, so a fast scroll can still paint', () => {
  renderRows();

  expect(optionsPassed().useFlushSync).toBe(false);
});

test('the window covers the page plus a scroll buffer', () => {
  renderRows();

  const options = optionsPassed();
  expect(options.count).toBe(500);
  expect(options.overscan).toBeGreaterThan(0);
  expect(options.estimateSize()).toBeGreaterThan(0);
});
