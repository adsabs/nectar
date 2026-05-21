import React from 'react';
import { render } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SearchModifierBar } from '../SearchModifierBar';
import { ADS_COMPAT_URL_PARAM, SearchMode } from '@/utils/common/searchMode';

const mockPush = vi.fn();
const mockQuery: Record<string, string> = {};

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    push: mockPush,
    pathname: '/search',
  }),
}));

// modeRef is module-scoped. The vi.mock factory body cannot reference it (hoisting TDZ),
// but useSearchMode is only called at render time, by which point it is initialized.
const modeRef = { current: '' as string };

vi.mock('@/lib/useSearchMode', () => ({
  // React.useState-backed mock: calling the returned setter causes a re-render, matching
  // the reactive contract the real Zustand hook provides.
  useSearchMode: () => {
    const [mode, setMode] = React.useState(modeRef.current);
    return [mode, setMode] as const;
  },
}));

describe('SearchModifierBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete mockQuery[ADS_COMPAT_URL_PARAM];
    modeRef.current = '';
  });

  test('renders "All relevant content" when mode param is absent', () => {
    const { getByRole } = render(<SearchModifierBar />);
    expect(getByRole('button')).toHaveTextContent('All relevant content');
  });

  test('renders "ADS Compatibility mode" when ads_compat=1', () => {
    mockQuery[ADS_COMPAT_URL_PARAM] = '1';
    const { getByRole } = render(<SearchModifierBar />);
    expect(getByRole('button')).toHaveTextContent('ADS Compatibility mode');
  });

  test('shows "Search mode:" prefix in the button', () => {
    const { getByText } = render(<SearchModifierBar />);
    expect(getByText('Search mode:')).toBeInTheDocument();
  });

  test('button has an accessible aria-label', () => {
    const { getByRole } = render(<SearchModifierBar />);
    expect(getByRole('button')).toHaveAttribute('aria-label');
  });

  test('opens dropdown showing both options', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<SearchModifierBar />);
    await user.click(getByRole('button'));
    expect(getByRole('menuitem', { name: /All relevant content/ })).toBeInTheDocument();
    expect(getByRole('menuitem', { name: /ADS Compatibility mode/ })).toBeInTheDocument();
  });

  test('selecting ADS_COMPAT calls router.push with ads_compat=1 and shallow:true', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<SearchModifierBar />);
    await user.click(getByRole('button'));
    await user.click(getByRole('menuitem', { name: /ADS Compatibility mode/ }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ [ADS_COMPAT_URL_PARAM]: '1' }) }),
      undefined,
      { shallow: true },
    );
  });

  test('selecting ALL_RELEVANT removes ads_compat param from URL', async () => {
    mockQuery[ADS_COMPAT_URL_PARAM] = '1';
    const user = userEvent.setup();
    const { getByRole } = render(<SearchModifierBar />);
    await user.click(getByRole('button'));
    await user.click(getByRole('menuitem', { name: /All relevant content/ }));
    expect(mockPush.mock.calls[0][0].query).not.toHaveProperty(ADS_COMPAT_URL_PARAM);
  });

  test('calls onModeChange before router.push when selecting a mode', async () => {
    const onModeChange = vi.fn();
    const callOrder: string[] = [];
    onModeChange.mockImplementation(() => callOrder.push('onModeChange'));
    mockPush.mockImplementation(() => callOrder.push('push'));

    const user = userEvent.setup();
    const { getByRole } = render(<SearchModifierBar onModeChange={onModeChange} />);
    await user.click(getByRole('button'));
    await user.click(getByRole('menuitem', { name: /ADS Compatibility mode/ }));
    expect(callOrder).toEqual(['onModeChange', 'push']);
    expect(onModeChange).toHaveBeenCalledWith(SearchMode.ADS_COMPAT);
  });

  test('calls onModeChange with ALL_RELEVANT when switching back', async () => {
    mockQuery[ADS_COMPAT_URL_PARAM] = '1';
    const onModeChange = vi.fn();
    const user = userEvent.setup();
    const { getByRole } = render(<SearchModifierBar onModeChange={onModeChange} />);
    await user.click(getByRole('button'));
    await user.click(getByRole('menuitem', { name: /All relevant content/ }));
    expect(onModeChange).toHaveBeenCalledWith(SearchMode.ALL_RELEVANT);
  });

  test('shows "All relevant content" immediately after selecting it when ADS_COMPAT was in storedMode (no URL mode)', async () => {
    modeRef.current = SearchMode.ADS_COMPAT;

    const user = userEvent.setup();
    const { getByRole } = render(<SearchModifierBar />);

    expect(getByRole('button')).toHaveTextContent('ADS Compatibility mode');

    await user.click(getByRole('button'));
    await user.click(getByRole('menuitem', { name: /All relevant content/ }));

    expect(getByRole('button')).toHaveTextContent('All relevant content');
  });

  test('shows "ADS Compatibility mode" immediately after selecting it when starting from All relevant content', async () => {
    const user = userEvent.setup();
    const { getByRole } = render(<SearchModifierBar />);

    expect(getByRole('button')).toHaveTextContent('All relevant content');

    await user.click(getByRole('button'));
    await user.click(getByRole('menuitem', { name: /ADS Compatibility mode/ }));

    expect(getByRole('button')).toHaveTextContent('ADS Compatibility mode');
  });

  describe('onNavigate prop', () => {
    test('calls onNavigate instead of router.push when onNavigate is provided', async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = render(<SearchModifierBar onNavigate={onNavigate} />);
      await user.click(getByRole('button'));
      await user.click(getByRole('menuitem', { name: /ADS Compatibility mode/ }));
      expect(onNavigate).toHaveBeenCalledWith(SearchMode.ADS_COMPAT);
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('does not call router.push when onNavigate is provided for ALL_RELEVANT', async () => {
      mockQuery[ADS_COMPAT_URL_PARAM] = '1';
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = render(<SearchModifierBar onNavigate={onNavigate} />);
      await user.click(getByRole('button'));
      await user.click(getByRole('menuitem', { name: /All relevant content/ }));
      expect(onNavigate).toHaveBeenCalledWith(SearchMode.ALL_RELEVANT);
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('calls onModeChange before onNavigate', async () => {
      const callOrder: string[] = [];
      const onModeChange = vi.fn(() => callOrder.push('onModeChange'));
      const onNavigate = vi.fn(() => callOrder.push('onNavigate'));

      const user = userEvent.setup();
      const { getByRole } = render(<SearchModifierBar onModeChange={onModeChange} onNavigate={onNavigate} />);
      await user.click(getByRole('button'));
      await user.click(getByRole('menuitem', { name: /ADS Compatibility mode/ }));
      expect(callOrder).toEqual(['onModeChange', 'onNavigate']);
    });

    test('updates button label via storedMode after onNavigate clears mode from URL', async () => {
      modeRef.current = SearchMode.ADS_COMPAT;

      const onNavigate = vi.fn();
      const user = userEvent.setup();
      const { getByRole } = render(<SearchModifierBar onNavigate={onNavigate} />);

      expect(getByRole('button')).toHaveTextContent('ADS Compatibility mode');

      await user.click(getByRole('button'));
      await user.click(getByRole('menuitem', { name: /All relevant content/ }));

      expect(onNavigate).toHaveBeenCalledWith(SearchMode.ALL_RELEVANT);
      expect(getByRole('button')).toHaveTextContent('All relevant content');
    });
  });
});
