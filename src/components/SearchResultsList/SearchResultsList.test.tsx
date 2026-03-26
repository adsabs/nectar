import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import { SearchResultsList } from './SearchResultsList';
import { IDocsEntity } from '@/api/search/types';

const makeDocs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    bibcode: `bib${i}`,
    title: [`Title ${i}`],
    author: [`Author ${i}`],
    pubdate: '2020-01-00',
    bibstem: ['ApJ'],
  }));

describe('SearchResultsList', () => {
  it('shows skeleton when isLoading is true', () => {
    render(<SearchResultsList docs={[]} isLoading indexStart={0} />);
    expect(screen.getByTestId('search-results-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('search-results-list')).not.toBeInTheDocument();
  });

  it('renders a list of items when loaded', () => {
    const docs = makeDocs(3) as IDocsEntity[];
    render(<SearchResultsList docs={docs} isLoading={false} indexStart={0} />);
    expect(screen.getByTestId('search-results-list')).toBeInTheDocument();
    expect(screen.queryByTestId('search-results-skeleton')).not.toBeInTheDocument();
  });

  it('renders empty list without error or skeleton when docs is empty', () => {
    render(<SearchResultsList docs={[]} isLoading={false} indexStart={0} />);
    expect(screen.queryByTestId('search-results-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies reduced opacity while fetching stale data', () => {
    render(<SearchResultsList docs={[]} isLoading={false} isFetching indexStart={0} />);
    const list = screen.getByTestId('search-results-list');
    expect(list).toHaveStyle('opacity: 0.5');
  });
});
