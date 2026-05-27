import { render } from '@/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AssociatedArticlesForm } from './AssociatedArticlesForm';

const onOpenAlert = vi.fn();

describe('AssociatedArticlesForm — new bibcode auto-commit on blur', () => {
  test('commits a typed bibcode to the list when focus leaves the add-bibcode group', () => {
    render(<AssociatedArticlesForm onOpenAlert={onOpenAlert} />);

    const stagingInput = screen.getByRole('textbox', { name: 'add new bibcode' });
    fireEvent.change(stagingInput, { target: { value: '2021arXiv210100001A' } });
    fireEvent.blur(stagingInput);

    // Committed state: value appears as a registered input row
    expect(screen.getByRole('textbox', { name: 'bibcode' })).toBeInTheDocument();
    // Staging input is cleared
    expect(stagingInput).toHaveValue('');
  });

  test('does not commit when staging input is empty on blur', () => {
    render(<AssociatedArticlesForm onOpenAlert={onOpenAlert} />);

    const stagingInput = screen.getByRole('textbox', { name: 'add new bibcode' });
    fireEvent.blur(stagingInput);

    // No committed row
    expect(screen.queryByRole('textbox', { name: 'bibcode' })).not.toBeInTheDocument();
  });
});
