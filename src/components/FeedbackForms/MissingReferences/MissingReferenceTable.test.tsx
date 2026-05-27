import { render } from '@/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MissingReferenceForm } from './MissingReferenceForm';

const onOpenAlert = vi.fn();

describe('MissingReferenceTable — new reference auto-commit on blur', () => {
  test('commits a typed reference pair to the table when focus leaves the new-row group', () => {
    render(<MissingReferenceForm onOpenAlert={onOpenAlert} />);

    const [citingInput, citedInput] = screen.getAllByPlaceholderText('1998ApJ...501L..41Y');
    fireEvent.change(citingInput, { target: { value: '2021arXiv210100001A' } });
    fireEvent.change(citedInput, { target: { value: '2020ApJ...900..100B' } });
    fireEvent.blur(citedInput);

    // Committed state: both values appear as text in the table
    expect(screen.getByText('2021arXiv210100001A')).toBeInTheDocument();
    expect(screen.getByText('2020ApJ...900..100B')).toBeInTheDocument();
    // citing persists for next entry; cited is cleared
    expect(citingInput).toHaveValue('2021arXiv210100001A');
    expect(citedInput).toHaveValue('');
  });

  test('does not commit when only one field is filled on blur', () => {
    render(<MissingReferenceForm onOpenAlert={onOpenAlert} />);

    const [citingInput] = screen.getAllByPlaceholderText('1998ApJ...501L..41Y');
    fireEvent.change(citingInput, { target: { value: '2021arXiv210100001A' } });
    fireEvent.blur(citingInput);

    // No committed row — text would appear as non-placeholder cell text
    expect(screen.queryByText('2021arXiv210100001A')).not.toBeInTheDocument();
  });

  test('does not auto-commit when focus moves between citing and cited inputs', () => {
    render(<MissingReferenceForm onOpenAlert={onOpenAlert} />);

    const [citingInput, citedInput] = screen.getAllByPlaceholderText('1998ApJ...501L..41Y');
    fireEvent.change(citingInput, { target: { value: '2021arXiv210100001A' } });
    fireEvent.change(citedInput, { target: { value: '2020ApJ...900..100B' } });

    // Blur from citing to cited — both are inside the same new-row <Tr>
    fireEvent.blur(citingInput, { relatedTarget: citedInput });

    // Guard should prevent premature commit
    expect(screen.queryByText('2021arXiv210100001A')).not.toBeInTheDocument();
    expect(screen.queryByText('2020ApJ...900..100B')).not.toBeInTheDocument();
  });
});
