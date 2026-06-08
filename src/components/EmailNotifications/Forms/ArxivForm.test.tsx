import { render, screen, waitFor } from '@/test-utils';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ArxivForm } from './ArxivForm';
import { arxivModel } from '../ArxivModel';

const mocks = vi.hoisted(() => ({
  addMutation: vi.fn(),
  editMutation: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/api/vault/vault', () => ({
  useAddNotification: () => ({
    mutate: mocks.addMutation,
    isLoading: false,
  }),
  useEditNotification: () => ({
    mutate: mocks.editMutation,
    isLoading: false,
  }),
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mocks.toast,
  };
});

const getCheckboxByValue = (value: string) => {
  const input = document.querySelector<HTMLInputElement>(`input[type="checkbox"][value="${value}"]`);
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
};

const clickCheckboxByValue = async (user: ReturnType<typeof render>['user'], value: string) => {
  const input = getCheckboxByValue(value);
  const label = input.closest('label');
  expect(label).not.toBeNull();
  await user.click(label as HTMLLabelElement);
};

describe('ArxivForm', () => {
  beforeEach(() => {
    mocks.addMutation.mockReset();
    mocks.editMutation.mockReset();
    mocks.toast.mockReset();
  });

  test('clicking a parent selects all children, then deselects all children when clicked again', async () => {
    const { user } = render(<ArxivForm onClose={vi.fn()} />);

    const parent = getCheckboxByValue('astro-ph');
    await clickCheckboxByValue(user, 'astro-ph');

    expect(parent).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'expand Astrophysics' }));

    expect(getCheckboxByValue('astro-ph.CO')).toBeChecked();
    expect(getCheckboxByValue('astro-ph.EP')).toBeChecked();
    expect(getCheckboxByValue('astro-ph.GA')).toBeChecked();
    expect(getCheckboxByValue('astro-ph.HE')).toBeChecked();
    expect(getCheckboxByValue('astro-ph.IM')).toBeChecked();
    expect(getCheckboxByValue('astro-ph.SR')).toBeChecked();

    await clickCheckboxByValue(user, 'astro-ph');

    expect(parent).not.toBeChecked();
    expect(getCheckboxByValue('astro-ph.CO')).not.toBeChecked();
    expect(getCheckboxByValue('astro-ph.EP')).not.toBeChecked();
    expect(getCheckboxByValue('astro-ph.GA')).not.toBeChecked();
    expect(getCheckboxByValue('astro-ph.HE')).not.toBeChecked();
    expect(getCheckboxByValue('astro-ph.IM')).not.toBeChecked();
    expect(getCheckboxByValue('astro-ph.SR')).not.toBeChecked();
  });

  test('clicking a child toggles only that child and updates the parent to indeterminate', async () => {
    const { user } = render(<ArxivForm onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'expand Astrophysics' }));

    const parent = getCheckboxByValue('astro-ph');
    const child = getCheckboxByValue('astro-ph.EP');

    expect(parent).not.toBeChecked();
    expect(child).not.toBeChecked();

    await clickCheckboxByValue(user, 'astro-ph.EP');

    expect(child).toBeChecked();
    expect(parent).toBePartiallyChecked();

    await clickCheckboxByValue(user, 'astro-ph.EP');

    expect(child).not.toBeChecked();
    expect(parent).not.toBeChecked();
  });

  test('submitting with all children selected collapses the payload to the parent class key', async () => {
    const { user } = render(<ArxivForm onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'expand Astrophysics' }));

    for (const childKey of Object.keys(arxivModel['astro-ph'].children)) {
      await clickCheckboxByValue(user, childKey);
    }

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mocks.addMutation).toHaveBeenCalledTimes(1);
    });

    expect(mocks.addMutation).toHaveBeenCalledWith(
      {
        type: 'template',
        template: 'arxiv',
        data: null,
        classes: ['astro-ph'],
      },
      expect.objectContaining({
        onSettled: expect.any(Function),
      }),
    );
    expect(mocks.editMutation).not.toHaveBeenCalled();
  });
});
