import { render, waitFor, within } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppMode } from '@/types';
import PaperForm from '../pages/paper-form';

const router = {
  pathname: '/',
  route: '/paper-form',
  push: vi.fn().mockResolvedValue(true),
  asPath: '/',
};
vi.mock('next/router', () => ({
  useRouter: () => router,
}));

describe('Paper Form', () => {
  beforeEach(() => router.push.mockReset());

  test('renders without error', () => {
    render(<PaperForm />);
  });

  // The paper form is Astrophysics-only, so submitting while viewing another
  // discipline must produce an Astrophysics search with a discipline-stable URL.
  test('forces an Astrophysics search on submit from a non-astro discipline', async () => {
    const { getByLabelText, getByTestId, user } = render(<PaperForm />, {
      initialStore: { mode: AppMode.GENERAL },
    });

    await user.type(getByLabelText('Year'), '2020');
    await user.click(within(getByTestId('journal-query')).getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    expect(router.push.mock.calls[0][0]).toContain('d=astrophysics');
  });

  test.todo('journal search works');
  test.todo('reference form works');
  test.todo('bibcode query form works');
  test.todo('error messages show up properly');
});
