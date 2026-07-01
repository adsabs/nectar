import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, waitFor } from '@/test-utils';
import { AppMode } from '@/types';
import { ClassicForm } from './ClassicForm';

const router = {
  route: '/classic-form',
  pathname: '/classic-form',
  asPath: '/classic-form',
  query: {},
  push: vi.fn().mockResolvedValue(true),
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

describe('ClassicForm', () => {
  beforeEach(() => router.push.mockReset());

  // The classic form is Astrophysics-only, so submitting while viewing another
  // discipline must still produce an Astrophysics search (SCIX-887).
  test('forces an Astrophysics search on submit from a non-astro discipline', async () => {
    const { getByText, user } = render(<ClassicForm ssrError="" />, { initialStore: { mode: AppMode.GENERAL } });

    await user.click(getByText('Search'));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    const arg = router.push.mock.calls[0][0] as { pathname: string; search: string };
    expect(arg.pathname).toBe('/search');
    expect(arg.search).toContain('d=astrophysics');
    expect(arg.search).not.toContain('general');
  });
});
