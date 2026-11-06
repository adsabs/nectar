import { render, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomFormat, IADSApiUserDataResponse } from '@/api/user/types';

import { CitationExporterEvent } from '../CitationExporter.machine';
import { CustomFormatSelect } from './CustomFormatSelect';

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(() => ({ isAuthenticated: true })),
  useSettings: vi.fn((): { settings: Partial<IADSApiUserDataResponse> } => ({ settings: {} })),
  dispatch: vi.fn<(event: CitationExporterEvent) => void>(),
}));

vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));
vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));

const SAVED: CustomFormat[] = [
  { id: 'format-aaaa', name: 'Zed Format', code: '%1H:%Y:%q' },
  { id: 'format-bbbb', name: 'Alpha Format', code: '%ZEncoding:latex\\bibitem{%R}' },
];

const withSaved = (customFormats: CustomFormat[]) => mocks.useSettings.mockReturnValue({ settings: { customFormats } });

const templates = (): string[] =>
  mocks.dispatch.mock.calls
    .map(([event]) => event)
    .filter(
      (event): event is Extract<CitationExporterEvent, { type: 'SET_CUSTOM_FORMAT' }> =>
        event.type === 'SET_CUSTOM_FORMAT',
    )
    .map((event) => String(event.payload));

beforeEach(() => {
  mocks.dispatch.mockReset();
  mocks.useSession.mockReturnValue({ isAuthenticated: true });
  withSaved(SAVED);
});

describe('CustomFormatSelect', () => {
  describe('without an initial id, today’s behaviour is unchanged', () => {
    it('uses the first saved format in array order', async () => {
      render(<CustomFormatSelect dispatch={mocks.dispatch} />);

      await waitFor(() => expect(templates()).toContain('%1H:%Y:%q'));
    });

    it('does not throw when nothing is saved', () => {
      withSaved([]);

      expect(() => render(<CustomFormatSelect dispatch={mocks.dispatch} />)).not.toThrow();
    });
  });

  describe('honouring a deep link’s customFormatId (criterion 7)', () => {
    it('selects the format the id names, not the first saved one', async () => {
      render(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-bbbb" />);

      await waitFor(() => expect(templates()).toContain('%ZEncoding:latex\\bibitem{%R}'));
    });

    it('does not use the first saved format when the id names another', async () => {
      render(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-bbbb" />);

      await waitFor(() => expect(mocks.dispatch).toHaveBeenCalled());
      expect(templates()).not.toContain('%1H:%Y:%q');
    });

    it('shows that format’s name in the selector', async () => {
      const { findByText } = render(
        <CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-bbbb" />,
      );

      expect(await findByText('Alpha Format')).toBeInTheDocument();
    });

    it('still submits so the citation is fetched', async () => {
      render(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-bbbb" />);

      await waitFor(() => expect(mocks.dispatch.mock.calls.some(([event]) => event.type === 'SUBMIT')).toBe(true));
    });
  });

  describe('an id that cannot be honoured falls back without error', () => {
    it('falls back to the first saved format for an unknown id', async () => {
      render(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-nope" />);

      await waitFor(() => expect(templates()).toContain('%1H:%Y:%q'));
    });

    it('falls back for a stale id whose format was deleted', async () => {
      withSaved([SAVED[0]]);

      render(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-bbbb" />);

      await waitFor(() => expect(templates()).toContain('%1H:%Y:%q'));
    });

    it('does not throw for an unknown id with nothing saved', () => {
      withSaved([]);

      expect(() =>
        render(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-nope" />),
      ).not.toThrow();
    });
  });

  describe('settings that arrive after the first render', () => {
    it('picks up the named format once the saved formats load', async () => {
      withSaved([]);
      const { rerender } = render(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-bbbb" />);

      withSaved(SAVED);
      rerender(<CustomFormatSelect dispatch={mocks.dispatch} initialCustomFormatId="format-bbbb" />);

      await waitFor(() => expect(templates()).toContain('%ZEncoding:latex\\bibitem{%R}'));
    });
  });
});
