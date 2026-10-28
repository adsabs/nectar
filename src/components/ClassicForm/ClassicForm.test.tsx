import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
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

const searchButtons = (): HTMLElement[] => screen.getAllByRole('button', { name: 'Search' });

describe('ClassicForm', () => {
  beforeEach(() => router.push.mockReset());

  // The classic form is Astrophysics-only, so submitting while viewing another
  // discipline must still produce an Astrophysics search (SCIX-887).
  test('forces an Astrophysics search on submit from a non-astro discipline', async () => {
    const { user } = render(<ClassicForm ssrError="" />, { initialStore: { mode: AppMode.GENERAL } });

    await user.click(searchButtons().at(-1));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    const arg = router.push.mock.calls[0][0] as { pathname: string; search: string };
    expect(arg.pathname).toBe('/search');
    expect(arg.search).toContain('d=astrophysics');
    expect(arg.search).not.toContain('general');
  });

  test('does not force ADS Compatibility mode on submit', async () => {
    const { user } = render(<ClassicForm ssrError="" />, {
      initialStore: { mode: AppMode.ASTROPHYSICS },
    });

    await user.click(searchButtons().at(-1));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    const arg = router.push.mock.calls[0][0] as { pathname: string; search: string };
    expect(arg.search).not.toContain('ads_compat');
  });

  describe('early Search button', () => {
    test('renders a second Search button between the Object row and Publication Date Start', () => {
      render(<ClassicForm ssrError="" />);

      const buttons = searchButtons();
      expect(buttons).toHaveLength(2);

      const object = screen.getByLabelText(/^Object/);
      const pubdateStart = screen.getByLabelText('Publication Date Start');
      const [early, bottom] = buttons;

      expect(object.compareDocumentPosition(early) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(early.compareDocumentPosition(pubdateStart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(pubdateStart.compareDocumentPosition(bottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('gives both buttons the same submit type and variant', () => {
      render(<ClassicForm ssrError="" />);

      const [early, bottom] = searchButtons();
      expect(early).toHaveAttribute('type', 'submit');
      expect(bottom).toHaveAttribute('type', 'submit');
      expect(early.className).toEqual(bottom.className);
    });

    test('leaves both submit buttons without a name or value', () => {
      render(<ClassicForm ssrError="" />);

      for (const button of searchButtons()) {
        expect(button).not.toHaveAttribute('name');
        expect(button).not.toHaveAttribute('value');
      }
    });

    test('submits the whole form from either button, including fields below the early one', async () => {
      const { user } = render(<ClassicForm ssrError="" />);
      expect(searchButtons()).toHaveLength(2);

      await user.type(screen.getByLabelText(/^Author/), 'Smith, John');
      await user.type(screen.getByLabelText('Title'), 'gravity waves');

      await user.click(searchButtons()[0]);
      await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
      const early = (router.push.mock.calls[0][0] as { search: string }).search;

      await user.click(searchButtons()[1]);
      await waitFor(() => expect(router.push).toHaveBeenCalledTimes(2));
      const bottom = (router.push.mock.calls[1][0] as { search: string }).search;

      expect(early).toEqual(bottom);
      const q = new URLSearchParams(early).get('q');
      expect(q).toContain('Smith, John');
      expect(q).toContain('gravity waves');
    });

    test.each([
      ['early', 0],
      ['bottom', 1],
    ])('submits exactly once from the %s button', async (_position, index) => {
      const { user } = render(<ClassicForm ssrError="" />);
      expect(searchButtons()).toHaveLength(2);

      await user.click(searchButtons()[index]);
      await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(router.push).toHaveBeenCalledTimes(1);
    });
  });
});
