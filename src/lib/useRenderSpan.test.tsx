import { act, render } from '@/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { IDocsEntity } from '@/api/search/types';

const setAttributes = vi.fn();
const end = vi.fn();
const startInactiveSpan = vi.fn(() => ({ setAttributes, setStatus: vi.fn(), end }));

vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  startInactiveSpan: (...args: unknown[]) => startInactiveSpan(...(args as [])),
}));

import { useResultsRenderSpan } from './useRenderSpan';

const docsFor = (count: number): IDocsEntity[] =>
  Array.from({ length: count }, (_, i) => ({ bibcode: `bib-${i}` } as IDocsEntity));

const Probe = ({ docs, windowed }: { docs: IDocsEntity[]; windowed: boolean }): null => {
  useResultsRenderSpan(docs, true, windowed);
  return null;
};

const renderAndSettle = async (docs: IDocsEntity[], windowed: boolean) => {
  render(<Probe docs={docs} windowed={windowed} />);
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
};

beforeEach(() => {
  setAttributes.mockClear();
  end.mockClear();
  startInactiveSpan.mockClear();
});

test('a windowed render is tagged so its duration is not compared with a full one', async () => {
  await renderAndSettle(docsFor(500), true);

  expect(setAttributes).toHaveBeenCalledWith({ doc_count: 500, windowed: true });
});

test('an ordinary render is tagged as not windowed', async () => {
  await renderAndSettle(docsFor(10), false);

  expect(setAttributes).toHaveBeenCalledWith({ doc_count: 10, windowed: false });
});

test('doc_count reports the whole page, not the rows the window mounted', async () => {
  await renderAndSettle(docsFor(500), true);

  const attributes = setAttributes.mock.calls.at(-1)?.[0] as { doc_count: number };
  expect(attributes.doc_count).toBe(500);
});

test('the span is not opened when measurement is not requested', () => {
  const Disabled = (): null => {
    useResultsRenderSpan(docsFor(500), false, true);
    return null;
  };

  render(<Disabled />);

  expect(startInactiveSpan).not.toHaveBeenCalled();
});
