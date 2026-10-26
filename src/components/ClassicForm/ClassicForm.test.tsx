import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, waitFor } from '@/test-utils';
import { AppMode } from '@/types';
import { ClassicForm } from './ClassicForm';
import { readClassicFormSnapshot, saveClassicFormSnapshot } from './form-snapshot';
import { defaultClassicFormState } from './ClassicForm';

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

const renderForm = (mode: AppMode = AppMode.ASTROPHYSICS) =>
  render(<ClassicForm ssrError="" />, { initialStore: { mode } });

const submittedSearch = () => {
  const arg = router.push.mock.calls[0][0] as { pathname: string; search: string };
  return arg.search;
};

describe('ClassicForm', () => {
  beforeEach(() => {
    router.push.mockReset();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // The classic form is Astrophysics-only, so submitting while viewing another
  // discipline must still produce an Astrophysics search (SCIX-887).
  test('forces an Astrophysics search on submit from a non-astro discipline', async () => {
    const { getByText, user } = renderForm(AppMode.GENERAL);

    await user.click(getByText('Search'));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    const arg = router.push.mock.calls[0][0] as { pathname: string; search: string };
    expect(arg.pathname).toBe('/search');
    expect(arg.search).toContain('d=astrophysics');
    expect(arg.search).not.toContain('general');
  });

  test('does not force ADS Compatibility mode on submit', async () => {
    const { getByText, user } = renderForm();

    await user.click(getByText('Search'));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    expect(submittedSearch()).not.toContain('ads_compat');
  });

  test('snapshots the submitted values', async () => {
    const { getByText, getByLabelText, user } = renderForm();

    await user.type(getByLabelText('Title'), 'star');
    await user.click(getByText('Search'));

    await waitFor(() => expect(readClassicFormSnapshot()?.title).toBe('star'));
  });

  test('stores nothing before a submit', async () => {
    const { getByLabelText, user } = renderForm();

    await user.type(getByLabelText('Title'), 'star');

    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('restores the snapshot on mount', async () => {
    saveClassicFormSnapshot({ ...defaultClassicFormState, title: 'star' });

    const { getByLabelText } = renderForm();

    await waitFor(() => expect((getByLabelText('Title') as HTMLInputElement).value).toBe('star'));
  });

  test('restores collection checkboxes, which the group would otherwise override', async () => {
    saveClassicFormSnapshot({ ...defaultClassicFormState, limit: ['astronomy', 'earthscience'] });

    const { container } = renderForm();

    await waitFor(() => {
      const checked = [...container.querySelectorAll<HTMLInputElement>('input[name="limit"]')]
        .filter((box) => box.checked)
        .map((box) => box.value);
      expect(checked).toEqual(['astronomy', 'earthscience']);
    });
  });

  test('restores a non-default logic radio, and submits the operator it displays', async () => {
    saveClassicFormSnapshot({ ...defaultClassicFormState, logic_title: 'boolean' });

    const { container, getByText, getByLabelText, user } = renderForm();

    await waitFor(() => {
      const checked = container.querySelector<HTMLInputElement>('input[name="logic_title"]:checked');
      expect(checked?.value).toBe('boolean');
    });

    await user.type(getByLabelText('Title'), 'star pulsar');
    await user.click(getByText('Search'));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    const search = decodeURIComponent(submittedSearch().replace(/\+/g, ' '));
    expect(search).toContain('title:(star pulsar)');
    expect(search).not.toContain('AND');
  });

  test('a restored value is what gets submitted, not the default', async () => {
    saveClassicFormSnapshot({ ...defaultClassicFormState, title: 'star' });

    const { getByText, user } = renderForm();
    await waitFor(() => expect(getByText('Search')).toBeInTheDocument());

    await user.click(getByText('Search'));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    expect(decodeURIComponent(submittedSearch().replace(/\+/g, ' '))).toContain('title:(star)');
  });

  test('the second submission replaces the first in storage', async () => {
    const { getByText, getByLabelText, user, unmount } = renderForm();

    await user.type(getByLabelText('Title'), 'star');
    await user.click(getByText('Search'));
    await waitFor(() => expect(readClassicFormSnapshot()?.title).toBe('star'));

    await user.clear(getByLabelText('Title'));
    await user.type(getByLabelText('Title'), 'pulsar');
    await user.click(getByText('Search'));

    await waitFor(() => expect(readClassicFormSnapshot()?.title).toBe('pulsar'));

    unmount();
    const remounted = renderForm();

    await waitFor(() => expect((remounted.getByLabelText('Title') as HTMLInputElement).value).toBe('pulsar'));
  });

  test('a restored collection reaches the submitted query, not just the checkbox', async () => {
    saveClassicFormSnapshot({ ...defaultClassicFormState, limit: ['earthscience'] });

    const { getByText, user } = renderForm();
    await waitFor(() => expect(getByText('Search')).toBeInTheDocument());

    await user.click(getByText('Search'));

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    const search = decodeURIComponent(submittedSearch().replace(/\+/g, ' '));
    expect(search).toContain('earthscience');
    expect(search).not.toContain('astronomy');
  });

  test('clearing the form empties the inputs and drops the snapshot', async () => {
    saveClassicFormSnapshot({ ...defaultClassicFormState, title: 'star' });

    const { getByText, getByLabelText, user } = renderForm();
    await waitFor(() => expect((getByLabelText('Title') as HTMLInputElement).value).toBe('star'));

    await user.click(getByText('Clear form'));

    await waitFor(() => expect((getByLabelText('Title') as HTMLInputElement).value).toBe(''));
    expect(readClassicFormSnapshot()).toBeNull();
  });

  test('clearing restores the default collections rather than the snapshot ones', async () => {
    saveClassicFormSnapshot({ ...defaultClassicFormState, limit: ['earthscience'] });

    const { getByText, container, user } = renderForm();
    await waitFor(() => {
      const checked = [...container.querySelectorAll<HTMLInputElement>('input[name="limit"]')].filter((b) => b.checked);
      expect(checked.map((b) => b.value)).toEqual(['earthscience']);
    });

    await user.click(getByText('Clear form'));

    await waitFor(() => {
      const checked = [...container.querySelectorAll<HTMLInputElement>('input[name="limit"]')].filter((b) => b.checked);
      expect(checked.map((b) => b.value)).toEqual(['astronomy', 'physics']);
    });
  });
});
