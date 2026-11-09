import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@chakra-ui/react';
import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiTargets } from '@/api/models';
import { DEFAULT_USER_DATA } from '@/api/user/models';
import { IADSApiUserDataResponse } from '@/api/user/types';
import { DEFAULT_EXPORT_FORMATS } from '@/components/CitationExporter/models';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { server } from '@/mocks/server';
import { createStore, StoreProvider } from '@/store';
import { theme } from '@/theme';
import { AppMode } from '@/types';

import { useCitationFormat } from './useCitationFormat';

const mocks = vi.hoisted(() => ({
  useSession: vi.fn<() => { isAuthenticated: boolean }>(),
  toast: Object.assign(vi.fn(), { isActive: vi.fn(() => false) }),
}));

vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return { ...actual, useToast: () => mocks.toast };
});

const createProdQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        cacheTime: 30 * 60 * 1000,
        retry: false,
        retryOnMount: false,
      },
    },
  });

const settingsHandler = (settings: Partial<IADSApiUserDataResponse>) =>
  rest.get(apiHandlerRoute(ApiTargets.USER_DATA), (_req, res, ctx) =>
    res(ctx.status(200), ctx.json({ ...DEFAULT_USER_DATA, ...settings })),
  );

const renderCitationFormat = (mode = AppMode.ASTROPHYSICS) => {
  const store = createStore({ mode });
  const queryClient = createProdQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider createStore={() => store}>{children}</StoreProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  return renderHook(() => useCitationFormat(), { wrapper });
};

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.useSession.mockReset();
  mocks.useSession.mockReturnValue({ isAuthenticated: false });

  server.use(
    rest.get(apiHandlerRoute(ApiTargets.EXPORT_MANIFEST), (_req, res, ctx) =>
      res(ctx.status(200), ctx.json(DEFAULT_EXPORT_FORMATS)),
    ),
  );
});

describe('useCitationFormat through the real settings query', () => {
  it('is ready immediately for an anonymous reader', () => {
    const { result } = renderCitationFormat(AppMode.PLANET_SCIENCE);

    expect(result.current.isReady).toBe(true);
    expect(result.current.format.id).toBe('icarus');
  });

  describe('on the first render, before an authenticated reader’s settings arrive', () => {
    beforeEach(() => {
      mocks.useSession.mockReturnValue({ isAuthenticated: true });
      server.use(settingsHandler({ defaultExportFormat: 'APS Journals' }));
    });

    it('renders rather than suspending', () => {
      const { result } = renderCitationFormat();

      expect(result.current.format).toBeDefined();
    });

    it('reports not ready', () => {
      const { result } = renderCitationFormat();

      expect(result.current.isReady).toBe(false);
    });

    it('resolves the placeholder format, which is the whole reason isReady exists', () => {
      const { result } = renderCitationFormat();

      expect(result.current.format.id).toBe('bibtex');
      expect(result.current.format.name).toBe('BibTeX');
    });

    it('settles on the saved format afterwards, so the window is real but transient', async () => {
      const { result } = renderCitationFormat();

      expect(result.current.format.id).toBe('bibtex');

      await waitFor(() => expect(result.current.isReady).toBe(true));
      expect(result.current.format.id).toBe('apsj');
    });
  });

  it('switches to the saved format once settings arrive', async () => {
    mocks.useSession.mockReturnValue({ isAuthenticated: true });
    server.use(settingsHandler({ defaultExportFormat: 'APS Journals' }));

    const { result } = renderCitationFormat();

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.format.id).toBe('apsj');
    expect(result.current.format.name).toBe('APS Journals');
  });

  it('honours a saved format that the quick-copy modal cannot show', async () => {
    mocks.useSession.mockReturnValue({ isAuthenticated: true });
    server.use(settingsHandler({ defaultExportFormat: 'APS Journals' }));

    const { result } = renderCitationFormat();

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.format.isInModal).toBe(false);
    expect(result.current.format.asHtml).toBe(true);
  });

  it('resolves a saved custom format with the name the reader gave it', async () => {
    mocks.useSession.mockReturnValue({ isAuthenticated: true });
    server.use(
      settingsHandler({
        defaultExportFormat: 'custom',
        customFormats: [{ id: 'format-abc', name: 'My Format', code: '%1H:%Y:%q' }],
      }),
    );

    const { result } = renderCitationFormat();

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.format.id).toBe('custom');
    expect(result.current.format.name).toBe('My Format');
    expect(result.current.format.customFormat).toBe('%1H:%Y:%q');
    expect(result.current.format.customFormatId).toBe('format-abc');
  });

  it('falls back to the discipline default when a custom default has no saved formats', async () => {
    mocks.useSession.mockReturnValue({ isAuthenticated: true });
    server.use(settingsHandler({ defaultExportFormat: 'custom', customFormats: [] }));

    const { result } = renderCitationFormat(AppMode.PLANET_SCIENCE);

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.format.id).toBe('icarus');
  });

  it('resolves from the settings passed to resolveWithSettings, not from hook state', async () => {
    mocks.useSession.mockReturnValue({ isAuthenticated: true });
    server.use(settingsHandler({ defaultExportFormat: 'BibTeX' }));

    const { result } = renderCitationFormat();

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.format.id).toBe('bibtex');

    const resolved = result.current.resolveWithSettings({ ...DEFAULT_USER_DATA, defaultExportFormat: 'AGU' });

    expect(resolved.id).toBe('agu');
    expect(resolved.asHtml).toBe(true);
  });
});
