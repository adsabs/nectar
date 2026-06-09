import { render, screen } from '@/test-utils';
import { describe, expect, test } from 'vitest';
import { ExportSkeleton } from './ExportSkeleton';

describe('ExportSkeleton', () => {
  test('renders the export container chrome with a heading slot', () => {
    render(<ExportSkeleton />);
    expect(screen.getByTestId('export-heading')).toBeInTheDocument();
  });

  test('renders skeleton placeholders', () => {
    const { container } = render(<ExportSkeleton />);
    expect(container.querySelectorAll('.chakra-skeleton').length).toBeGreaterThan(0);
  });
});
