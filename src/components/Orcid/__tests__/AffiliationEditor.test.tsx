import { render, waitFor } from '@/test-utils';
import { AffiliationEditor } from '../UserSettings';
import { Mock, afterEach, describe, expect, test, vi } from 'vitest';
import { useOrcidPrefs } from '@/lib/orcid/useOrcidPrefs';

vi.mock('@/lib/orcid/useOrcidPrefs', () => ({
  useOrcidPrefs: vi.fn(),
}));

const mockedUseOrcidPrefs = useOrcidPrefs as unknown as Mock;

afterEach(() => {
  vi.clearAllMocks();
});

describe('AffiliationEditor', () => {
  test('saves affiliation when preferences are undefined', async () => {
    const setPreferences = vi.fn();

    mockedUseOrcidPrefs.mockReturnValue({
      preferences: undefined,
      setPreferences,
    });

    const { user, getByRole } = render(<AffiliationEditor id="aff-editor" />);

    await user.click(getByRole('button', { name: /edit/i }));
    const input = getByRole('textbox');
    await user.type(input, 'Harvard University');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(setPreferences).toHaveBeenCalledWith({
        preferences: { currentAffiliation: 'Harvard University' },
      });
    });
  });

  test('does not save when the affiliation is unchanged after trimming', async () => {
    const setPreferences = vi.fn();

    mockedUseOrcidPrefs.mockReturnValue({
      preferences: { currentAffiliation: 'Existing Affiliation' },
      setPreferences,
    });

    const { user, getByRole } = render(<AffiliationEditor id="aff-editor" />);

    await user.click(getByRole('button', { name: /edit/i }));
    const input = getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Existing Affiliation   ');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(setPreferences).not.toHaveBeenCalled();
    });
  });

  test('escapes and persists new affiliation while preserving other prefs', async () => {
    const setPreferences = vi.fn();
    const preferences = { currentAffiliation: 'Old', nameVariations: ['Alias'] };

    mockedUseOrcidPrefs.mockReturnValue({
      preferences,
      setPreferences,
    });

    const { user, getByRole } = render(<AffiliationEditor id="aff-editor" />);

    await user.click(getByRole('button', { name: /edit/i }));
    const input = getByRole('textbox');
    await user.clear(input);
    await user.type(input, '  <New Affiliation>  ');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(setPreferences).toHaveBeenCalledWith({
        preferences: { currentAffiliation: '&lt;New Affiliation&gt;', nameVariations: ['Alias'] },
      });
    });
  });
});
