import { act, render, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactElement } from 'react';

import { DEFAULT_USER_DATA } from '@/api/user/models';
import { IADSApiUserDataResponse } from '@/api/user/types';
import { DEFAULT_EXPORT_FORMATS } from '@/components/CitationExporter/models';
import { AppMode } from '@/types';

import { CitationCopyButton } from './CitationCopyButton';

interface ClipboardInput {
  content: string | Promise<string>;
  asHtml: boolean;
}

interface ExportParams {
  format: string;
  bibcode: string[];
  customFormat?: string;
}

interface QueryContext {
  meta: { params: ExportParams };
}

interface ToastOptions {
  title?: string;
  status?: string;
}

const mocks = vi.hoisted(() => {
  const push = vi.fn<(url: string) => Promise<boolean>>();
  return {
    push,
    useRouter: vi.fn(() => ({
      query: {},
      asPath: '/abs/2003NanoL...3..459S',
      push,
      events: { on: vi.fn(), off: vi.fn() },
    })),
    useSession: vi.fn(() => ({ isAuthenticated: false })),
    useSettings: vi.fn(() => ({
      settings: DEFAULT_USER_DATA,
      getSettingsState: { isPlaceholderData: false },
    })),
    useGetExportFormats: vi.fn(() => ({ data: DEFAULT_EXPORT_FORMATS })),
    fetchExportCitation: vi.fn<(context: QueryContext) => Promise<{ export: string }>>(),
    copyToClipboard: vi.fn<(input: ClipboardInput) => Promise<void>>(),
    toast: vi.fn<(options: ToastOptions) => void>(),
    fetchUserSettings: vi.fn<() => Promise<IADSApiUserDataResponse>>(),
  };
});

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));
vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/lib/clipboard', () => ({ copyToClipboard: mocks.copyToClipboard }));

vi.mock('@/api/export/export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/export/export')>();
  return {
    ...actual,
    useGetExportFormats: mocks.useGetExportFormats,
    fetchExportCitation: mocks.fetchExportCitation,
  };
});

vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@chakra-ui/react')>();
  return { ...actual, useToast: () => mocks.toast };
});

vi.mock('@/api/user/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/user/user')>();
  return { ...actual, fetchUserSettings: mocks.fetchUserSettings };
});

const BIBCODE = '2003NanoL...3..459S';
const OTHER_BIBCODE = '2020ApJ...999..999B';
const COPY = /^Copy citation/;
const CHEVRON = 'Change citation format';
const CONFIRMATION = 'citation-copy-confirmation';
const CUSTOM_FORMAT = { id: 'format-abc', name: 'My Format', code: '%1H:%Y:%q' };

const onOpenModal = vi.fn();

const renderButton = (mode = AppMode.ASTROPHYSICS, bibcode = BIBCODE) => {
  const result = render(<CitationCopyButton bibcode={bibcode} onOpenModal={onOpenModal} />, {
    initialStore: { mode },
  });

  return {
    ...result,
    clickCopy: () => result.user.click(result.getByRole('button', { name: COPY })),
    clickChevron: () => result.user.click(result.getByRole('button', { name: CHEVRON })),
  };
};

const moveOn = (rerender: (ui: ReactElement) => void): void =>
  rerender(<CitationCopyButton bibcode={OTHER_BIBCODE} onOpenModal={onOpenModal} />);

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const pendingCitation = () => {
  const pending = deferred<{ export: string }>();
  mocks.fetchExportCitation.mockReturnValue(pending.promise);
  return pending;
};

const pendingSettings = () => {
  const pending = deferred<IADSApiUserDataResponse>();
  mocks.fetchUserSettings.mockReturnValue(pending.promise);
  return pending;
};

const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
};

const asSignedIn = (settings: Partial<IADSApiUserDataResponse>): void => {
  mocks.useSession.mockReturnValue({ isAuthenticated: true });
  mocks.useSettings.mockReturnValue({
    settings: { ...DEFAULT_USER_DATA, ...settings },
    getSettingsState: { isPlaceholderData: false },
  });
};

const asPlaceholder = (real?: Partial<IADSApiUserDataResponse>): void => {
  mocks.useSession.mockReturnValue({ isAuthenticated: true });
  mocks.useSettings.mockReturnValue({
    settings: { ...DEFAULT_USER_DATA, defaultExportFormat: 'BibTeX' },
    getSettingsState: { isPlaceholderData: true },
  });
  if (real) {
    mocks.fetchUserSettings.mockResolvedValue({ ...DEFAULT_USER_DATA, ...real } as IADSApiUserDataResponse);
  }
};

const settingsResolving = (defaultExportFormat: string): IADSApiUserDataResponse =>
  ({ ...DEFAULT_USER_DATA, defaultExportFormat } as IADSApiUserDataResponse);

const exportParams = (call = 0): ExportParams => mocks.fetchExportCitation.mock.calls[call][0].meta.params;
const clipboardInput = (call = 0): ClipboardInput => mocks.copyToClipboard.mock.calls[call][0];
const requestedFormats = (): string[] => mocks.fetchExportCitation.mock.calls.map((call) => call[0].meta.params.format);
const titles = (): string[] => mocks.toast.mock.calls.map((call) => String(call[0]?.title ?? ''));
const hasErrorToast = (): boolean => mocks.toast.mock.calls.some((call) => call[0]?.status === 'error');

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.push.mockReset();
  mocks.push.mockResolvedValue(true);
  onOpenModal.mockClear();
  mocks.copyToClipboard.mockReset();
  mocks.copyToClipboard.mockImplementation(({ content }) => Promise.resolve(content).then((): void => undefined));
  mocks.fetchExportCitation.mockReset();
  mocks.fetchExportCitation.mockResolvedValue({ export: 'Star, A. et al. 2003' });
  mocks.useSession.mockReturnValue({ isAuthenticated: false });
  mocks.fetchUserSettings.mockReset();
  mocks.fetchUserSettings.mockResolvedValue(DEFAULT_USER_DATA);
  mocks.useSettings.mockReturnValue({
    settings: DEFAULT_USER_DATA,
    getSettingsState: { isPlaceholderData: false },
  });
});

describe('the copy segment copies immediately (criterion 2)', () => {
  it('names the resolved format in both segments’ accessible names (criterion 1)', () => {
    const { getByRole } = renderButton();

    expect(getByRole('button', { name: 'Copy citation (BibTeX)' })).toBeInTheDocument();
    expect(getByRole('button', { name: CHEVRON })).toBeInTheDocument();
  });

  it('requests the record on screen and hands the citation to the clipboard', async () => {
    const { clickCopy } = renderButton();

    await clickCopy();

    await waitFor(() => expect(mocks.copyToClipboard).toHaveBeenCalledTimes(1));
    expect(mocks.fetchExportCitation).toHaveBeenCalledTimes(1);
    expect(exportParams().bibcode).toEqual([BIBCODE]);
    await expect(Promise.resolve(clipboardInput().content)).resolves.toBe('Star, A. et al. 2003');
    await waitFor(() => expect(titles()).toContain('Copied BibTeX citation to clipboard.'));
  });

  it('never opens the modal from the copy segment', async () => {
    const { clickCopy } = renderButton();

    await clickCopy();

    await waitFor(() => expect(mocks.copyToClipboard).toHaveBeenCalled());
    expect(onOpenModal).not.toHaveBeenCalled();
  });
});

describe('signed-out resolution follows the app mode (criterion 4)', () => {
  it.each([
    { mode: AppMode.ASTROPHYSICS, id: 'bibtex', name: 'BibTeX', asHtml: false },
    { mode: AppMode.HELIOPHYSICS, id: 'agu', name: 'AGU', asHtml: true },
    { mode: AppMode.PLANET_SCIENCE, id: 'icarus', name: 'Icarus', asHtml: false },
    { mode: AppMode.EARTH_SCIENCE, id: 'agu', name: 'AGU', asHtml: true },
    { mode: AppMode.GENERAL, id: 'agu', name: 'AGU', asHtml: true },
    { mode: AppMode.BIO_PHYSICAL, id: 'apsj', name: 'APS Journals', asHtml: true },
  ])('$mode requests $id and copies it as html=$asHtml', async ({ mode, id, name, asHtml }) => {
    const { clickCopy } = renderButton(mode);

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe(id);
    expect(exportParams().customFormat).toBeUndefined();
    expect(clipboardInput().asHtml).toBe(asHtml);
    await waitFor(() => expect(titles()).toContain(`Copied ${name} citation to clipboard.`));
  });
});

describe('signed-in resolution follows the saved export format (criterion 3)', () => {
  it.each([
    { label: 'BibTeX', id: 'bibtex', asHtml: false },
    { label: 'AGU', id: 'agu', asHtml: true },
    { label: 'APS Journals', id: 'apsj', asHtml: true },
    { label: 'RIS', id: 'ris', asHtml: false },
  ])('a saved default of $label requests $id as html=$asHtml (criterion 9)', async ({ label, id, asHtml }) => {
    asSignedIn({ defaultExportFormat: label });
    const { clickCopy } = renderButton();

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe(id);
    expect(clipboardInput().asHtml).toBe(asHtml);
  });

  it('ignores the app mode once a format is saved', async () => {
    asSignedIn({ defaultExportFormat: 'APS Journals' });
    const { clickCopy } = renderButton(AppMode.PLANET_SCIENCE);

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe('apsj');
  });

  it('sends a saved custom format as its template, as plain text, under its own name', async () => {
    asSignedIn({ defaultExportFormat: 'custom', customFormats: [CUSTOM_FORMAT] });
    const { clickCopy } = renderButton();

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe('custom');
    expect(exportParams().customFormat).toBe('%1H:%Y:%q');
    expect(clipboardInput().asHtml).toBe(false);
    await waitFor(() => expect(titles()).toContain('Copied My Format citation to clipboard.'));
    expect(titles()).not.toContain('Copied custom citation to clipboard.');
  });

  it('falls back to the discipline default when no custom format is saved', async () => {
    asSignedIn({ defaultExportFormat: 'custom', customFormats: [] });
    const { clickCopy } = renderButton(AppMode.PLANET_SCIENCE);

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe('icarus');
    expect(exportParams().customFormat).toBeUndefined();
  });
});

describe('a copy that fails does not report success (criterion 13)', () => {
  it('raises an error toast and no success toast when the write is rejected', async () => {
    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
    const { clickCopy } = renderButton();

    await clickCopy();
    await settle();

    expect(hasErrorToast()).toBe(true);
    expect(titles()).not.toContain('Copied BibTeX citation to clipboard.');
  });

  it('raises no success toast when the citation request fails', async () => {
    mocks.fetchExportCitation.mockRejectedValue(new Error('export service down'));
    mocks.copyToClipboard.mockRejectedValue(new Error('content failed'));
    const { clickCopy } = renderButton();

    await clickCopy();
    await settle();

    expect(titles()).not.toContain('Copied BibTeX citation to clipboard.');
  });
});

describe('settings still loading for a signed-in user (criterion 3, the placeholder window)', () => {
  it('copies the real saved format rather than the placeholder', async () => {
    asPlaceholder({ defaultExportFormat: 'APS Journals' });
    const { clickCopy } = renderButton();

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe('apsj');
    expect(requestedFormats()).not.toContain('bibtex');
    await waitFor(() => expect(titles()).toContain('Copied APS Journals citation to clipboard.'));
  });

  it('reports an error when the settings request fails', async () => {
    asPlaceholder();
    mocks.fetchUserSettings.mockRejectedValue(new Error('settings unavailable'));
    const { clickCopy } = renderButton();

    await clickCopy();
    await settle();

    expect(hasErrorToast()).toBe(true);
    expect(mocks.fetchExportCitation).not.toHaveBeenCalled();
  });

  it('reads settings from the cache rather than the network once they are ready', async () => {
    asSignedIn({ defaultExportFormat: 'APS Journals' });
    const { clickCopy } = renderButton();

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe('apsj');
    expect(mocks.fetchUserSettings).not.toHaveBeenCalled();
  });
});

describe('the chevron routes by whether the format is in the modal list (criteria 5 and 6)', () => {
  it('opens the quick-copy modal for a format the modal can show', async () => {
    const { clickChevron } = renderButton(AppMode.ASTROPHYSICS);

    await clickChevron();

    expect(onOpenModal).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('deep-links to Export Citation for a format the modal cannot show', async () => {
    const { clickChevron } = renderButton(AppMode.BIO_PHYSICAL);

    await clickChevron();

    expect(mocks.push).toHaveBeenCalledWith(`/abs/${BIBCODE}/exportcitation/apsj`);
    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it('carries customFormatId when the default is a saved custom format', async () => {
    asSignedIn({ defaultExportFormat: 'custom', customFormats: [CUSTOM_FORMAT] });
    const { clickChevron } = renderButton();

    await clickChevron();

    expect(mocks.push).toHaveBeenCalledWith(`/abs/${BIBCODE}/exportcitation/custom?customFormatId=format-abc`);
    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it('escapes the bibcode in the deep link', async () => {
    const { clickChevron } = renderButton(AppMode.BIO_PHYSICAL, '2003A&A...1..1X');

    await clickChevron();

    expect(mocks.push).toHaveBeenCalledWith('/abs/2003A%26A...1..1X/exportcitation/apsj');
  });

  it('never copies anything from the chevron', async () => {
    const { clickChevron } = renderButton(AppMode.BIO_PHYSICAL);

    await clickChevron();

    expect(mocks.copyToClipboard).not.toHaveBeenCalled();
    expect(mocks.fetchExportCitation).not.toHaveBeenCalled();
  });
});

describe('the chevron during the placeholder window (panel finding 1)', () => {
  it('deep-links to the real out-of-list default instead of opening the modal', async () => {
    asPlaceholder({ defaultExportFormat: 'APS Journals' });
    const { clickChevron } = renderButton();

    await clickChevron();

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(`/abs/${BIBCODE}/exportcitation/apsj`));
    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it('carries customFormatId for a real custom default', async () => {
    asPlaceholder({ defaultExportFormat: 'custom', customFormats: [CUSTOM_FORMAT] });
    const { clickChevron } = renderButton();

    await clickChevron();

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(`/abs/${BIBCODE}/exportcitation/custom?customFormatId=format-abc`),
    );
    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it('opens the modal when the real default is one the modal can show', async () => {
    asPlaceholder({ defaultExportFormat: 'AGU' });
    const { clickChevron } = renderButton();

    await clickChevron();

    await waitFor(() => expect(onOpenModal).toHaveBeenCalledTimes(1));
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe('a partial settings response does not break the copy (panel finding 3)', () => {
  it('falls back to the discipline default when the fresh response omits customFormats', async () => {
    asPlaceholder();
    mocks.fetchUserSettings.mockResolvedValue({
      defaultExportFormat: 'custom',
    } as unknown as IADSApiUserDataResponse);
    const { clickCopy } = renderButton(AppMode.PLANET_SCIENCE);

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    expect(exportParams().format).toBe('icarus');
  });

  it('sends no NaN author bounds for a partial fresh response', async () => {
    asPlaceholder();
    mocks.fetchUserSettings.mockResolvedValue({
      defaultExportFormat: 'BibTeX',
    } as unknown as IADSApiUserDataResponse);
    const { clickCopy } = renderButton();

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalled());
    const params = exportParams() as unknown as Record<string, unknown>;
    expect(JSON.stringify(params)).not.toContain('null');
    expect(
      Object.values(params)
        .flat()
        .some((value) => typeof value === 'number' && Number.isNaN(value)),
    ).toBe(false);
  });
});

describe('the clipboard write stays inside the user gesture (criterion 12a)', () => {
  it('calls the clipboard with a promise before the citation request resolves', async () => {
    const citation = pendingCitation();
    const { clickCopy } = renderButton();

    await clickCopy();

    expect(mocks.copyToClipboard).toHaveBeenCalledTimes(1);
    expect(mocks.fetchExportCitation).toHaveBeenCalledTimes(1);
    expect(typeof (clipboardInput().content as Promise<string>)?.then).toBe('function');

    citation.resolve({ export: 'late citation' });

    await expect(Promise.resolve(clipboardInput().content)).resolves.toBe('late citation');
  });
});

describe('a copy in flight when the reader moves on (criterion 12b)', () => {
  it('still completes the copy the reader asked for', async () => {
    const citation = pendingCitation();
    const { clickCopy, rerender } = renderButton();

    await clickCopy();
    moveOn(rerender);
    citation.resolve({ export: 'record A citation' });

    await expect(Promise.resolve(clipboardInput().content)).resolves.toBe('record A citation');
    expect(mocks.copyToClipboard).toHaveBeenCalledTimes(1);
  });

  it('does not announce the copy against the record the reader is now on', async () => {
    const citation = pendingCitation();
    const { clickCopy, rerender, queryByTestId } = renderButton();

    await clickCopy();
    moveOn(rerender);
    citation.resolve({ export: 'record A citation' });
    await settle();

    expect(titles()).not.toContain('Copied BibTeX citation to clipboard.');
    expect(queryByTestId(CONFIRMATION)).toBeNull();
  });

  it('does not report a failure against the record the reader is now on either', async () => {
    const citation = pendingCitation();
    const { clickCopy, rerender } = renderButton();

    await clickCopy();
    moveOn(rerender);
    citation.reject(new Error('export service down'));
    await settle();

    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it('does report a failure when the reader is still on the record', async () => {
    const citation = pendingCitation();
    const { clickCopy } = renderButton();

    await clickCopy();
    citation.reject(new Error('export service down'));

    await waitFor(() => expect(hasErrorToast()).toBe(true));
  });
});

describe('the chevron in flight when the reader moves on (REV finding 1)', () => {
  it.each([
    { outcome: 'a deep link', real: 'APS Journals' },
    { outcome: 'the modal', real: 'AGU' },
  ])('does not route to $outcome against a record the reader has left', async ({ real }) => {
    asPlaceholder();
    const settings = pendingSettings();
    const { clickChevron, rerender } = renderButton();

    await clickChevron();
    moveOn(rerender);
    settings.resolve(settingsResolving(real));
    await settle();

    expect(mocks.push).not.toHaveBeenCalled();
    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it('does not route when the settings request fails after the reader moves on', async () => {
    asPlaceholder();
    const settings = pendingSettings();
    const { clickChevron, rerender } = renderButton();

    await clickChevron();
    moveOn(rerender);
    settings.reject(new Error('settings unavailable'));
    await settle();

    expect(mocks.push).not.toHaveBeenCalled();
    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it('still routes when the reader stays on the record', async () => {
    asPlaceholder({ defaultExportFormat: 'APS Journals' });
    const { clickChevron } = renderButton();

    await clickChevron();

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith(`/abs/${BIBCODE}/exportcitation/apsj`));
  });
});

describe('a failed citation request does not brick later copies (criterion 12c)', () => {
  it('issues a fresh request on the next click and succeeds', async () => {
    mocks.fetchExportCitation.mockRejectedValueOnce(new Error('export service down'));
    mocks.copyToClipboard.mockRejectedValueOnce(new Error('content failed'));
    const { clickCopy } = renderButton();

    await clickCopy();
    await settle();
    expect(mocks.fetchExportCitation).toHaveBeenCalledTimes(1);
    mocks.toast.mockClear();

    await clickCopy();

    await waitFor(() => expect(mocks.fetchExportCitation).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(titles()).toContain('Copied BibTeX citation to clipboard.'));
  });
});

describe('the copy segment confirms in place as well as by toast', () => {
  it('shows the confirmation only after the write resolves, then clears it', async () => {
    const { clickCopy, findByTestId, queryByTestId } = renderButton();

    expect(queryByTestId(CONFIRMATION)).toBeNull();

    await clickCopy();

    expect(await findByTestId(CONFIRMATION)).toBeInTheDocument();
    await waitFor(() => expect(queryByTestId(CONFIRMATION)).toBeNull(), { timeout: 3000 });
  });

  it('shows no confirmation when the write is refused', async () => {
    mocks.copyToClipboard.mockRejectedValue(new Error('NotAllowedError'));
    const { clickCopy, queryByTestId } = renderButton();

    await clickCopy();
    await settle();

    expect(queryByTestId(CONFIRMATION)).toBeNull();
  });

  it('keeps the segment usable so a second copy still works', async () => {
    const { clickCopy, findByTestId } = renderButton();

    await clickCopy();
    await findByTestId(CONFIRMATION);
    mocks.copyToClipboard.mockClear();

    await clickCopy();

    await waitFor(() => expect(mocks.copyToClipboard).toHaveBeenCalledTimes(1));
  });
});
