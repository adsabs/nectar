import { render, screen } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { AppState, useStore } from '@/store';
import OrcidPage from '../pages/user/orcid';

vi.mock('@/components/Orcid/UserSettings', () => ({ UserSettings: (): null => null }));
vi.mock('@/components/Orcid/WorksTable', () => ({ WorksTable: (): null => null }));

const orcidActiveSelector = (state: AppState) => state.orcid.active;
const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;

// Exposes live store state/actions in the DOM so the test can read and
// drive the store the same way the expiry watcher would, without needing
// to render the watcher itself.
const StoreProbe = () => {
  const active = useStore(orcidActiveSelector);
  const setOrcidMode = useStore(setOrcidModeSelector);
  return (
    <div>
      <div data-testid="active-probe">{String(active)}</div>
      <button data-testid="expire-button" onClick={() => setOrcidMode(false)}>
        simulate expiry
      </button>
    </div>
  );
};

describe('OrcidPage', () => {
  test('turns mode on when visiting with mode off', () => {
    render(
      <>
        <OrcidPage />
        <StoreProbe />
      </>,
      { initialStore: { orcid: { active: false, isAuthenticated: false, user: null, lastActivityAt: null } } },
    );

    expect(screen.getByTestId('active-probe').textContent).toBe('true');
  });

  test('does not re-enable mode when it turns off while the page stays mounted', async () => {
    const { user } = render(
      <>
        <OrcidPage />
        <StoreProbe />
      </>,
      { initialStore: { orcid: { active: true, isAuthenticated: false, user: null, lastActivityAt: Date.now() } } },
    );

    expect(screen.getByTestId('active-probe').textContent).toBe('true');

    // simulate the expiry watcher turning mode off mid-visit
    await user.click(screen.getByTestId('expire-button'));

    expect(screen.getByTestId('active-probe').textContent).toBe('false');
  });
});
