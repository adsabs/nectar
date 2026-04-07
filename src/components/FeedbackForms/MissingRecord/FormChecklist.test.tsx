import { describe, test, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import { FormProvider, useForm } from 'react-hook-form';
import { FormValues } from './types';
import { FormChecklist } from './FormChecklist';

function Wrapper({ values }: { values: Partial<FormValues> }) {
  const methods = useForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      isNew: true,
      bibcode: '',
      collection: [],
      title: '',
      noAuthors: false,
      authors: [],
      publication: '',
      pubDate: '',
      urls: [],
      abstract: '',
      keywords: [],
      references: [],
      comments: '',
      ...values,
    },
  });
  return (
    <FormProvider {...methods}>
      <FormChecklist />
    </FormProvider>
  );
}

describe('FormChecklist', () => {
  test('renders 6 checklist items', () => {
    render(<Wrapper values={{}} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });

  test('all items incomplete when form is empty', () => {
    render(<Wrapper values={{}} />);
    screen.getAllByRole('listitem').forEach((item) => {
      expect(item).toHaveAttribute('data-complete', 'false');
    });
  });

  test('marks Name complete when name has a value', () => {
    render(<Wrapper values={{ name: 'Alice' }} />);
    expect(screen.getByTestId('checklist-name')).toHaveAttribute('data-complete', 'true');
  });

  test('marks Email complete when email is present', () => {
    render(<Wrapper values={{ email: 'alice@example.com' }} />);
    expect(screen.getByTestId('checklist-email')).toHaveAttribute('data-complete', 'true');
  });

  test('marks Title complete when title is present', () => {
    render(<Wrapper values={{ title: 'My Paper' }} />);
    expect(screen.getByTestId('checklist-title')).toHaveAttribute('data-complete', 'true');
  });

  test('marks Authors complete when authors list is non-empty', () => {
    render(<Wrapper values={{ authors: [{ name: 'Alice', aff: '', orcid: '' }] }} />);
    expect(screen.getByTestId('checklist-authors')).toHaveAttribute('data-complete', 'true');
  });

  test('marks Authors complete when noAuthors is true', () => {
    render(<Wrapper values={{ noAuthors: true }} />);
    expect(screen.getByTestId('checklist-authors')).toHaveAttribute('data-complete', 'true');
  });

  test('shows progress count', () => {
    render(<Wrapper values={{ name: 'Alice', email: 'a@b.com' }} />);
    expect(screen.getByText(/2 of 6/i)).toBeInTheDocument();
  });

  test('shows 0 of 6 when all fields empty', () => {
    render(<Wrapper values={{}} />);
    expect(screen.getByText(/0 of 6/i)).toBeInTheDocument();
  });

  test('shows 6 of 6 when all required fields complete', () => {
    render(
      <Wrapper
        values={{
          name: 'Alice',
          email: 'a@b.com',
          title: 'My Paper',
          publication: 'Nature',
          pubDate: '2024-01',
          noAuthors: true,
        }}
      />,
    );
    expect(screen.getByText(/6 of 6/i)).toBeInTheDocument();
  });
});
