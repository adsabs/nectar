import { render } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PaperForm, { getSearchQuery } from '../pages/paper-form';
import { AppMode } from '@/types';
import { QueryClient } from '@tanstack/react-query';

const router = {
  pathname: '/',
  push: vi.fn(),
  asPath: '/',
};
vi.mock('next/router', () => ({
  useRouter: () => router,
}));

describe('Paper Form', () => {
  beforeEach(() => router.push.mockReset());

  test('renders without error', () => {
    render(<PaperForm />);
  });

  test.todo('journal search works');
  test.todo('reference form works');
  test.todo('bibcode query form works');
  test.todo('error messages show up properly');
});

describe('getSearchQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  test('should set "d" to ASTROPHYSICS when adsMode is enabled and no override is present', async () => {
    const searchQuery = await getSearchQuery(
      { form: 'journal-query', bibstem: 'ApJ' },
      queryClient,
      true,
      AppMode.GENERAL,
      undefined,
    );
    const searchParams = new URLSearchParams(searchQuery.split('?')[1]);
    expect(searchParams.get('d')).toBe('astrophysics');
  });

  test('should set "d" to the override value when adsMode is enabled and an override is present', async () => {
    const searchQuery = await getSearchQuery(
      { form: 'journal-query', bibstem: 'ApJ' },
      queryClient,
      true,
      AppMode.GENERAL,
      AppMode.HELIOPHYSICS,
    );
    const searchParams = new URLSearchParams(searchQuery.split('?')[1]);
    expect(searchParams.get('d')).toBe('heliophysics');
  });

  test('should set "d" to the current mode when adsMode is disabled', async () => {
    const searchQuery = await getSearchQuery(
      { form: 'journal-query', bibstem: 'ApJ' },
      queryClient,
      false,
      AppMode.PLANET_SCIENCE,
      undefined,
    );
    const searchParams = new URLSearchParams(searchQuery.split('?')[1]);
    expect(searchParams.get('d')).toBe('planetary');
  });
});
