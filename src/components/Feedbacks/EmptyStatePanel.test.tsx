import { render, screen } from '@/test-utils';
import { describe, expect, test } from 'vitest';
import { EmptyStatePanel } from './EmptyStatePanel';

describe('EmptyStatePanel', () => {
  test('renders title and description', () => {
    render(<EmptyStatePanel title="No citations yet" description="Papers that cite this work will appear here." />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText('No citations yet')).toBeInTheDocument();
    expect(screen.getByText('Papers that cite this work will appear here.')).toBeInTheDocument();
  });

  test('renders primary action when provided', () => {
    render(
      <EmptyStatePanel
        title="No citations yet"
        description="Papers that cite this work will appear here."
        primaryAction={{ label: 'Show in search results', href: '/search?q=citations(bibcode:test)' }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Show in search results' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/search?q=citations(bibcode:test)');
  });

  test('renders secondary action when provided', () => {
    render(
      <EmptyStatePanel
        title="No references listed"
        description="This paper does not have indexed references."
        secondaryAction={{ label: 'Back to Abstract', href: '/abs/test/abstract' }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Back to Abstract' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/abs/test/abstract');
  });

  test('renders both actions when provided', () => {
    render(
      <EmptyStatePanel
        title="No citations yet"
        description="Papers that cite this work will appear here."
        primaryAction={{ label: 'Show in search results', href: '/search?q=test' }}
        secondaryAction={{ label: 'Back to Abstract', href: '/abs/test/abstract' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Show in search results' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Abstract' })).toBeInTheDocument();
  });
});
