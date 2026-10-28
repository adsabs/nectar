import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor, within } from '@/test-utils';
import { AppMode } from '@/types';
import { ClassicForm, defaultClassicFormState } from './ClassicForm';

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

  describe('no-JS POST shape', () => {
    const nameValuePairs = (role: 'checkbox' | 'radio'): string[] =>
      screen
        .getAllByRole(role)
        .map((input) => `${input.getAttribute('name')}=${input.getAttribute('value')}`)
        .sort();

    test('keeps the Collection and Property checkbox name/value pairs', () => {
      render(<ClassicForm ssrError="" />);

      expect(nameValuePairs('checkbox')).toEqual([
        'limit=astronomy',
        'limit=earthscience',
        'limit=general',
        'limit=physics',
        'property=articles-only',
        'property=refereed-only',
      ]);
    });

    test('keeps the logic radio name/value pairs', () => {
      render(<ClassicForm ssrError="" />);

      expect(nameValuePairs('radio')).toEqual([
        'logic_abstract_keywords=and',
        'logic_abstract_keywords=boolean',
        'logic_abstract_keywords=or',
        'logic_author=and',
        'logic_author=or',
        'logic_object=and',
        'logic_object=or',
        'logic_title=and',
        'logic_title=boolean',
        'logic_title=or',
      ]);
    });

    test('builds the same POST body the GSSP handler expects', async () => {
      const { user } = render(<ClassicForm ssrError="" />);

      await user.type(screen.getByLabelText(/^Author/), 'Smith, John');
      await user.type(screen.getByLabelText('Title'), 'gravity waves');
      await user.click(screen.getByRole('checkbox', { name: 'Refereed only' }));
      await user.click(within(screen.getAllByRole('radiogroup')[0]).getByRole('radio', { name: 'Or' }));

      const form = screen.getByLabelText(/^Author/).closest('form');
      const body = new FormData(form);

      expect(body.getAll('limit')).toEqual(['astronomy', 'physics']);
      expect(body.getAll('property')).toEqual(['refereed-only']);
      expect(body.get('author')).toBe('Smith, John');
      expect(body.get('title')).toBe('gravity waves');
      expect(body.get('logic_author')).toBe('or');
      expect(body.get('logic_object')).toBe('and');
      expect(body.get('logic_title')).toBe('and');
      expect(body.get('logic_abstract_keywords')).toBe('and');
      expect(body.get('sort')).toBe('date desc');
      expect(body.has('bibstems')).toBe(true);
    });

    test('marks the defaultClassicFormState options as checked on first render', () => {
      render(<ClassicForm ssrError="" />);

      for (const input of screen.getAllByRole('checkbox')) {
        const value = input.getAttribute('value');
        const field = input.getAttribute('name') === 'limit' ? 'limit' : 'property';
        const expected = (defaultClassicFormState[field] as string[]).includes(value);
        expect((input as HTMLInputElement).checked).toBe(expected);
      }

      for (const group of screen.getAllByRole('radiogroup')) {
        const and = within(group).getByRole('radio', { name: 'And' }) as HTMLInputElement;
        expect(and.checked).toBe(true);
      }
    });
  });

  describe('Reset button', () => {
    const resetButton = (): HTMLElement => screen.getByRole('button', { name: 'Reset' });

    test('renders exactly one Reset button, after the bottom Search button', () => {
      render(<ClassicForm ssrError="" />);

      expect(screen.getAllByRole('button', { name: 'Reset' })).toHaveLength(1);

      const [early, bottom] = searchButtons();
      const reset = resetButton();
      const pubdateStart = screen.getByLabelText('Publication Date Start');

      expect(bottom.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(early.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(pubdateStart.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('is a native reset button, so it still works without JS', () => {
      render(<ClassicForm ssrError="" />);

      expect(resetButton()).toHaveAttribute('type', 'reset');
    });

    test('is the immediate next sibling of the bottom Search button', () => {
      render(<ClassicForm ssrError="" />);

      const bottom = searchButtons().at(-1);
      const reset = resetButton();

      expect(reset.parentElement).toBe(bottom.parentElement);
      expect(bottom.nextElementSibling).toBe(reset);
    });

    test('is styled as a secondary action, unlike the primary Search buttons', () => {
      render(<ClassicForm ssrError="" />);

      const [early, bottom] = searchButtons();
      const reset = resetButton();

      expect(early.className).toEqual(bottom.className);
      expect(reset.className).not.toEqual(bottom.className);
    });

    test('restores defaultClassicFormState and does not navigate', async () => {
      const { user } = render(<ClassicForm ssrError="" />);

      const author = screen.getByLabelText(/^Author/) as HTMLTextAreaElement;
      const title = screen.getByLabelText('Title') as HTMLInputElement;
      const pubdateStart = screen.getByLabelText('Publication Date Start') as HTMLInputElement;
      const general = screen.getByRole('checkbox', { name: 'General' }) as HTMLInputElement;
      const astronomy = screen.getByRole('checkbox', { name: 'Astronomy' }) as HTMLInputElement;
      const refereed = screen.getByRole('checkbox', { name: 'Refereed only' }) as HTMLInputElement;

      await user.type(author, 'Smith, John');
      await user.type(title, 'gravity waves');
      await user.type(pubdateStart, '2020/01');
      await user.click(general);
      await user.click(astronomy);
      await user.click(refereed);

      expect(author).toHaveValue('Smith, John');
      expect(title).toHaveValue('gravity waves');
      expect(pubdateStart).toHaveValue('2020/01');
      expect(general.checked).toBe(true);
      expect(astronomy.checked).toBe(false);
      expect(refereed.checked).toBe(true);

      await user.click(resetButton());

      await waitFor(() => expect(author).toHaveValue(defaultClassicFormState.author));
      expect(title).toHaveValue(defaultClassicFormState.title);
      expect(pubdateStart).toHaveValue(defaultClassicFormState.pubdate_start);
      expect(general.checked).toBe(defaultClassicFormState.limit.includes('general'));
      expect(astronomy.checked).toBe(defaultClassicFormState.limit.includes('astronomy'));
      expect(refereed.checked).toBe(defaultClassicFormState.property.includes('refereed-only'));

      expect(router.push).not.toHaveBeenCalled();
    });

    test('restores the And/Or/Boolean logic radios', async () => {
      const { user } = render(<ClassicForm ssrError="" />);

      const groups = screen.getAllByRole('radiogroup');
      expect(groups.length).toBeGreaterThanOrEqual(4);

      const changed = groups.map((group) => {
        const or = within(group).getByRole('radio', { name: 'Or' }) as HTMLInputElement;
        return or;
      });

      for (const or of changed) {
        await user.click(or);
      }
      for (const or of changed) {
        expect(or.checked).toBe(true);
      }

      await user.click(resetButton());

      await waitFor(() => expect(changed[0].checked).toBe(false));
      for (const group of groups) {
        const and = within(group).getByRole('radio', { name: 'And' }) as HTMLInputElement;
        const or = within(group).getByRole('radio', { name: 'Or' }) as HTMLInputElement;
        expect(and.checked).toBe(true);
        expect(or.checked).toBe(false);
      }
    });

    test('clears the selected journals in the Publications picker', async () => {
      const { user } = render(<ClassicForm ssrError="" />);

      const picker = screen.getByLabelText('bibstem picker');
      await user.click(picker);
      await user.type(picker, 'ApJ');
      await user.click(await screen.findByText('The Astrophysical Journal (ApJ)'));

      expect(screen.getAllByText('ApJ').length).toBeGreaterThan(0);

      await user.click(searchButtons().at(-1));
      await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
      expect((router.push.mock.calls[0][0] as { search: string }).search).toContain('bibstem');

      await user.click(resetButton());

      await waitFor(() => expect(screen.queryAllByText('ApJ')).toHaveLength(0));

      await user.click(searchButtons().at(-1));
      await waitFor(() => expect(router.push).toHaveBeenCalledTimes(2));
      expect((router.push.mock.calls[1][0] as { search: string }).search).not.toContain('bibstem');
    });

    test('resets the query a subsequent submit produces', async () => {
      const { user } = render(<ClassicForm ssrError="" />);

      await user.click(searchButtons().at(-1));
      await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
      const pristine = (router.push.mock.calls[0][0] as { search: string }).search;

      await user.type(screen.getByLabelText(/^Author/), 'Smith, John');
      await user.click(resetButton());
      await waitFor(() => expect(screen.getByLabelText(/^Author/)).toHaveValue(''));

      await user.click(searchButtons().at(-1));
      await waitFor(() => expect(router.push).toHaveBeenCalledTimes(2));
      const afterReset = (router.push.mock.calls[1][0] as { search: string }).search;

      expect(afterReset).toEqual(pristine);
      expect(new URLSearchParams(afterReset).get('q')).not.toContain('Smith');
    });
  });
});
