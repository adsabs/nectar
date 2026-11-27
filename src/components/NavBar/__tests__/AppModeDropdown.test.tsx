import { afterEach, describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NextRouter } from 'next/router';
import { render, screen } from '@/test-utils';
import { AppModeDropdown } from '../AppModeDropdown';

const sendGTMEvent = vi.fn();
vi.mock('@next/third-parties/google', () => ({
  sendGTMEvent: (...args: unknown[]) => sendGTMEvent(...args),
}));

const mockRouter = {
  pathname: '/',
  asPath: '/',
  query: {},
  isReady: true,
  push: vi.fn().mockResolvedValue(true),
  replace: vi.fn().mockResolvedValue(true),
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
} as unknown as NextRouter;

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

afterEach(() => {
  sendGTMEvent.mockReset();
});

describe('AppModeDropdown analytics', () => {
  test('selecting a discipline emits discipline_change with a discipline parameter', async () => {
    const user = userEvent.setup();
    render(<AppModeDropdown />);

    await user.click(screen.getByLabelText('Select theme'));
    await user.click(await screen.findByText('Heliophysics'));

    expect(sendGTMEvent).toHaveBeenCalledTimes(1);
    expect(sendGTMEvent).toHaveBeenCalledWith({
      event: 'discipline_change',
      discipline: 'HELIOPHYSICS',
    });
  });
});
