import { describe, expect, test } from 'vitest';

import { render, screen } from '@/test-utils';
import { AbsRecordSkeleton } from './AbsRecordSkeleton';

describe('AbsRecordSkeleton', () => {
  test('renders the loading status region', () => {
    render(<AbsRecordSkeleton />);
    const region = screen.getByTestId('abs-record-skeleton');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Loading record…')).toBeInTheDocument();
  });
});
