import { render } from '@/test-utils';
import { expect, test, vi } from 'vitest';
import { LandingTabs } from '@/components/LandingTabs';
import { AppMode } from '@/types';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({ pathname: '/' })),
}));

vi.mock('next/router', () => ({
  useRouter: mocks.useRouter,
}));

test('renders without crashing', () => {
  render(<LandingTabs />);
});

test('Renders moder-form active', () => {
  mocks.useRouter.mockImplementationOnce(() => ({ pathname: '/' }));
  const { getByTestId, getByText } = render(<LandingTabs />, { initialStore: { mode: AppMode.ASTROPHYSICS } });
  expect(getByText('Modern Form')).toBeVisible();
  expect(getByTestId('active-tab')).toHaveValue('modern-form');
});

test('Renders paper-form active', () => {
  mocks.useRouter.mockImplementationOnce(() => ({ pathname: '/paper-form' }));
  const { getByTestId, getByText } = render(<LandingTabs />, { initialStore: { mode: AppMode.ASTROPHYSICS } });
  expect(getByText('Modern Form')).toBeVisible();
  expect(getByTestId('active-tab')).toHaveValue('paper-form');
});

test('Renders classic-form active', () => {
  mocks.useRouter.mockImplementationOnce(() => ({ pathname: '/classic-form' }));
  const { getByText, getByTestId } = render(<LandingTabs />, { initialStore: { mode: AppMode.ASTROPHYSICS } });
  expect(getByText('Modern Form')).toBeVisible();
  expect(getByTestId('active-tab')).toHaveValue('classic-form');
});

test('When app-mode is astro does not show tabs', () => {
  mocks.useRouter.mockImplementationOnce(() => ({ pathname: '/' }));
  const { getByText } = render(<LandingTabs />, { initialStore: { mode: AppMode.GENERAL } });
  expect(() => getByText('Modern Form')).toThrow();
});

test.skip.each<[AppMode]>([
  [AppMode.ASTROPHYSICS],
  [AppMode.GENERAL],
  [AppMode.BIO_PHYSICAL],
  [AppMode.PLANET_SCIENCE],
  [AppMode.EARTH_SCIENCE],
  [AppMode.HELIOPHYSICS],
])('LandingTabs (%s)', (mode) => {
  mocks.useRouter.mockImplementationOnce(() => ({ pathname: '/' }));
  const { container } = render(<LandingTabs />, { initialStore: { mode } });
  expect(container).toMatchFileSnapshot(`./__snapshots__/landing-tabs-${mode}`);
});
