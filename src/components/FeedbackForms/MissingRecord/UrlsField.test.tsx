import { render } from '@/test-utils';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { UrlsField } from './UrlsField';
import { FormValues } from './types';

const Wrapper = ({ children }: { children: ReactNode }) => {
  const methods = useForm<FormValues>({ defaultValues: { urls: [] } });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('UrlsField — new URL auto-commit on blur', () => {
  test('commits a typed URL to the table when focus leaves the new-URL row', async () => {
    render(
      <Wrapper>
        <UrlsField />
      </Wrapper>,
    );

    // useIsClient delays rendering the Select until after mount
    const urlInput = await screen.findByRole('textbox');
    fireEvent.change(urlInput, { target: { value: 'https://arxiv.org/abs/2101.00001' } });
    fireEvent.blur(urlInput);

    // Committed state: URL appears as text in the table (not in an input)
    await waitFor(() => {
      expect(screen.getByText('https://arxiv.org/abs/2101.00001')).toBeInTheDocument();
    });
    // Staging input is reset to the arXiv default prefix
    expect(urlInput).not.toHaveValue('https://arxiv.org/abs/2101.00001');
  });

  test('does not commit when the staged URL is invalid on blur', async () => {
    render(
      <Wrapper>
        <UrlsField />
      </Wrapper>,
    );

    const urlInput = await screen.findByRole('textbox');
    // Default value "https://arxiv.org/" is invalid (pathname length === 1)
    fireEvent.blur(urlInput);

    // No committed rows (header row + 1 new-entry row = row count stays at 2)
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
  });

  test('does not auto-commit when focus moves between siblings within the new-URL row', async () => {
    render(
      <Wrapper>
        <UrlsField />
      </Wrapper>,
    );

    const urlInput = await screen.findByRole('textbox');
    fireEvent.change(urlInput, { target: { value: 'https://arxiv.org/abs/2101.00001' } });

    const addButton = screen.getByRole('button', { name: 'add url' });

    // Blur with relatedTarget set to the Add button (sibling within the same <Tr>)
    // The contains() guard should detect this and skip auto-commit
    fireEvent.blur(urlInput, { relatedTarget: addButton });

    // URL should NOT be committed — header row + new-entry row = 2 rows
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
