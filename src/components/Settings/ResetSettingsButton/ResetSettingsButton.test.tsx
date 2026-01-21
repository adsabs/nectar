import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetSettingsButton } from './ResetSettingsButton';
import { UserDataKeys } from '@/api/user/types';
import { DEFAULT_USER_DATA } from '@/api/user/models';

const mockUpdateSettings = vi.fn();

vi.mock('@/lib/useSettings', () => ({
  useSettings: () => ({
    updateSettings: mockUpdateSettings,
    settings: DEFAULT_USER_DATA,
    updateSettingsState: { isPending: false },
    getSettingsState: {},
  }),
}));

describe('ResetSettingsButton', () => {
  beforeEach(() => {
    mockUpdateSettings.mockClear();
  });

  it('renders reset button', () => {
    render(<ResetSettingsButton settingsKeys={[UserDataKeys.PREFERRED_SEARCH_SORT]} label="Reset Search Settings" />);
    expect(screen.getByRole('button', { name: /reset search settings/i })).toBeInTheDocument();
  });

  it('opens confirmation dialog on click', async () => {
    render(<ResetSettingsButton settingsKeys={[UserDataKeys.PREFERRED_SEARCH_SORT]} label="Reset Search Settings" />);
    fireEvent.click(screen.getByRole('button', { name: /reset search settings/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('calls updateSettings with default values when confirmed', async () => {
    render(
      <ResetSettingsButton
        settingsKeys={[UserDataKeys.PREFERRED_SEARCH_SORT, UserDataKeys.MIN_AUTHOR_RESULT]}
        label="Reset Search Settings"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /reset search settings/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /reset$/i }));
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        [UserDataKeys.PREFERRED_SEARCH_SORT]: DEFAULT_USER_DATA[UserDataKeys.PREFERRED_SEARCH_SORT],
        [UserDataKeys.MIN_AUTHOR_RESULT]: DEFAULT_USER_DATA[UserDataKeys.MIN_AUTHOR_RESULT],
      });
    });
  });

  it('closes dialog without action when cancelled', async () => {
    render(<ResetSettingsButton settingsKeys={[UserDataKeys.PREFERRED_SEARCH_SORT]} label="Reset Search Settings" />);
    fireEvent.click(screen.getByRole('button', { name: /reset search settings/i }));
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });
});
