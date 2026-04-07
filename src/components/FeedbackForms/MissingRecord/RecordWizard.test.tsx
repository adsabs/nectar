import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RecordWizard } from './RecordWizard';
import { FormValues } from './types';

vi.mock('@/lib/useGetResourceLinks', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useGetResourceLinks')>('@/lib/useGetResourceLinks');
  return {
    ...actual,
    useGetResourceLinks: vi.fn(() => ({
      data: [] as import('@/lib/useGetResourceLinks').IResourceUrl[],
      isSuccess: false,
      isFetching: false,
      refetch: vi.fn(),
    })),
  };
});

// These field components are tested independently. Stub them here so the
// wizard tests can focus on navigation and validation gating without
// triggering jsdom incompatibilities (react-select portal, @zag-js focus tracking).
vi.mock('./UrlsField', () => ({ UrlsField: () => <div data-testid="urls-field-mock" /> }));
vi.mock('./AuthorsField', () => ({ AuthorsField: () => <div data-testid="authors-field-mock" /> }));
vi.mock('./KeywordsField', () => ({ KeywordsField: () => <div data-testid="keywords-field-mock" /> }));
vi.mock('./ReferencesField', () => ({ ReferencesField: () => <div data-testid="references-field-mock" /> }));

// Stub Chakra Checkbox/CheckboxGroup to avoid @zag-js/focus-visible jsdom crash
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return {
    ...actual,
    Checkbox: ({ children, value }: { children?: React.ReactNode; value?: string }) => (
      <label>
        <input type="checkbox" value={value} />
        {children}
      </label>
    ),
    CheckboxGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  title: z.string().min(1, 'Title is required'),
  publication: z.string().min(1, 'Publication is required'),
  pubDate: z.string().min(1, 'Publication date is required'),
  collection: z.array(z.string()),
  isNew: z.boolean(),
  bibcode: z.string(),
  noAuthors: z.boolean(),
  authors: z.array(z.any()),
  urls: z.array(z.any()),
  abstract: z.string(),
  keywords: z.array(z.any()),
  references: z.array(z.any()),
  comments: z.string(),
});

const defaultValues: FormValues = {
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
};

function Wrapper({ onPreview = vi.fn() }: { onPreview?: () => void }) {
  const methods = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(testSchema),
    mode: 'onTouched',
    shouldFocusError: false,
  });
  return (
    <FormProvider {...methods}>
      <RecordWizard onPreview={onPreview} isLoading={false} />
    </FormProvider>
  );
}

describe('RecordWizard', () => {
  test('renders step 1 (Contact) with name and email fields', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText('Name*')).toBeInTheDocument();
    expect(screen.getByLabelText('Email*')).toBeInTheDocument();
  });

  test('Back button is disabled on the first step', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  test('shows all 5 step labels in the stepper', () => {
    render(<Wrapper />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Publication')).toBeInTheDocument();
    expect(screen.getByText('Authors')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('References')).toBeInTheDocument();
  });

  test('does not advance when required fields on step 1 are empty', async () => {
    const { user } = render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    // Still on step 1 — name and email fields visible
    await waitFor(() => expect(screen.getByLabelText('Name*')).toBeInTheDocument());
  });

  test('advances to step 2 when Contact fields are valid', async () => {
    const { user } = render(<Wrapper />);
    await user.type(screen.getByLabelText('Name*'), 'Alice');
    await user.type(screen.getByLabelText('Email*'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(screen.getByLabelText('Title*')).toBeInTheDocument());
  });

  test('Back button returns to previous step', async () => {
    const { user } = render(<Wrapper />);
    await user.type(screen.getByLabelText('Name*'), 'Alice');
    await user.type(screen.getByLabelText('Email*'), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => screen.getByLabelText('Title*'));
    await user.click(screen.getByRole('button', { name: /back/i }));
    await waitFor(() => expect(screen.getByLabelText('Name*')).toBeInTheDocument());
  });

  test('shows validation error when email is invalid', async () => {
    const { user } = render(<Wrapper />);
    await user.type(screen.getByLabelText('Name*'), 'Alice');
    await user.type(screen.getByLabelText('Email*'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /next/i }));
    // zod's .email() fires before .min(1) — error is "Invalid email"
    await waitFor(() => expect(screen.getByText(/invalid email/i)).toBeInTheDocument());
  });
});
