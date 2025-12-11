import { render, screen } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { TimeSince } from '../TimeSince';

describe('TimeSince', () => {
  const mockNow = new Date('2024-03-15T12:00:00Z');

  beforeEach(() => {
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('valid dates', () => {
    test('renders relative time for recent date with timezone', () => {
      const date = '2024-03-15T11:00:00+00:00';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toMatch(/hour|ago/i);
    });

    test('renders relative time for date without timezone (adds UTC)', () => {
      const date = '2024-03-15T11:00:00';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toMatch(/hour|ago/i);
    });

    test('renders tooltip with formatted date', async () => {
      const date = '2024-03-15T10:30:45+00:00';
      const { user } = render(<TimeSince date={date} />);
      const box = screen.getByText(/hour/i);
      await user.hover(box);
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.textContent).toContain('2024');
      expect(tooltip.textContent).toContain('Mar');
      expect(tooltip.textContent).toContain('15');
    });

    test('handles dates from several days ago', () => {
      const date = '2024-03-10T12:00:00+00:00';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toMatch(/\d+ days ago/i);
    });

    test('handles dates from months ago', () => {
      const date = '2024-01-15T12:00:00+00:00';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toMatch(/\d+ months ago/i);
    });

    test('handles future dates', () => {
      const date = '2024-03-16T12:00:00+00:00';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toBeTruthy();
      expect(container.textContent).toMatch(/tomorrow|in \d+/);
    });
  });

  describe('edge cases and invalid dates', () => {
    test('returns null for null date', () => {
      const { container } = render(<TimeSince date={null} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('returns null for undefined date', () => {
      const { container } = render(<TimeSince date={undefined} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('returns null for empty string without showing epoch date', () => {
      const date = '';
      const { container } = render(<TimeSince date={date} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('returns null for malformed date string', () => {
      const date = 'not-a-date';
      const { container } = render(<TimeSince date={date} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('returns null for date with invalid format', () => {
      const date = '2024-99-99T25:61:61';
      const { container } = render(<TimeSince date={date} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('returns null for whitespace-only string', () => {
      const date = '   ';
      const { container } = render(<TimeSince date={date} />);
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    test('handles very old dates correctly', () => {
      const date = '1995-06-15T12:00:00+00:00';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toMatch(/\d+ years ago/i);
    });

    test('handles dates with different timezone formats', () => {
      const date = '2024-03-15T11:00:00-05:00';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toBeTruthy();
      const text = container.textContent?.toLowerCase() || '';
      expect(text).not.toContain('1970');
      expect(text).toMatch(/in|hour/i);
    });

    test('handles ISO date without time portion', () => {
      const date = '2024-03-15';
      const { container } = render(<TimeSince date={date} />);
      expect(container.textContent).toBeTruthy();
      const text = container.textContent?.toLowerCase() || '';
      expect(text).not.toContain('1970');
    });
  });

  describe('accessibility', () => {
    test('box element is keyboard focusable with tabIndex', () => {
      const date = '2024-03-15T10:00:00+00:00';
      const { container } = render(<TimeSince date={date} />);
      const box = container.querySelector('[tabindex="-1"]');
      expect(box).toBeInTheDocument();
      expect(box).toHaveTextContent(/\w+/);
    });
  });
});
