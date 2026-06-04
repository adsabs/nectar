import { act } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ExportApiFormatKey } from '@/api/export/types';
import { renderHook, waitFor } from '@/test-utils';

import { useCitationExporter } from './useCitationExporter';

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/', push: vi.fn(), asPath: '/', query: {}, beforePopState: vi.fn() }),
}));

const baseProps = {
  records: ['2021APS..APRA01003G'],
  format: ExportApiFormatKey.bibtex,
  singleMode: false,
};

describe('useCitationExporter — prop ↔ machine sync', () => {
  test('SET_FORMAT dispatched from UI persists and is not reverted by the prop-sync effect', () => {
    const { result, rerender } = renderHook(() => useCitationExporter(baseProps));

    expect(result.current.state.context.params.format).toBe(ExportApiFormatKey.bibtex);

    act(() => {
      result.current.dispatch({ type: 'SET_FORMAT', payload: ExportApiFormatKey.endnote });
    });

    expect(result.current.state.context.params.format).toBe(ExportApiFormatKey.endnote);

    // Re-render with the same (unchanged) props. The prop-sync effect must not
    // revert the user's choice back to the original `format` prop.
    rerender();
    expect(result.current.state.context.params.format).toBe(ExportApiFormatKey.endnote);
  });

  test('prop change still syncs into the machine', () => {
    const { result, rerender } = renderHook(
      ({ format }: { format: ExportApiFormatKey }) => useCitationExporter({ ...baseProps, format }),
      undefined,
      { initialProps: { format: ExportApiFormatKey.bibtex } },
    );

    expect(result.current.state.context.params.format).toBe(ExportApiFormatKey.bibtex);

    rerender({ format: ExportApiFormatKey.ris });
    expect(result.current.state.context.params.format).toBe(ExportApiFormatKey.ris);
  });
});

describe('useCitationExporter — initial loading', () => {
  test('reports isLoading during the on-mount prefetch when nothing is cached', async () => {
    const { result } = renderHook(() => useCitationExporter(baseProps));

    // with no cached export, the initial prefetch is in flight: the consumer
    // should see a loading state (not the idle "press submit" placeholder)
    expect(result.current.isLoading).toBe(true);

    // once the prefetch settles, loading clears
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
