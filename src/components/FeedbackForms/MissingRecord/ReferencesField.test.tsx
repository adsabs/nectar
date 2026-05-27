import { render } from '@/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { ReferencesField } from './ReferencesField';
import { FormValues } from './types';

const Wrapper = ({ children }: { children: ReactNode }) => {
  const methods = useForm<FormValues>({ defaultValues: { references: [] } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ReferencesField — new reference auto-commit on blur', () => {
  test('commits a typed reference to the table when focus leaves the new-reference row', async () => {
    render(
      <Wrapper>
        <ReferencesField />
      </Wrapper>,
    );

    const refInput = await screen.findByRole('textbox');
    fireEvent.change(refInput, { target: { value: '2021arXiv210100001A' } });
    fireEvent.blur(refInput);

    await waitFor(() => {
      expect(screen.getByText('2021arXiv210100001A')).toBeInTheDocument();
    });
    expect(refInput).toHaveValue('');
  });

  test('does not commit when the staged reference is empty on blur', async () => {
    render(
      <Wrapper>
        <ReferencesField />
      </Wrapper>,
    );

    const refInput = await screen.findByRole('textbox');
    fireEvent.blur(refInput);

    // No committed rows — header row + new-entry row = 2 rows
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  test('does not auto-commit when focus moves between siblings within the new-reference row', async () => {
    render(
      <Wrapper>
        <ReferencesField />
      </Wrapper>,
    );

    const refInput = await screen.findByRole('textbox');
    fireEvent.change(refInput, { target: { value: '2021arXiv210100001A' } });

    const addButton = screen.getByRole('button', { name: 'add Reference' });

    fireEvent.blur(refInput, { relatedTarget: addButton });

    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
