import { render, screen, waitFor } from '@/test-utils';
import { describe, test, expect } from 'vitest';
import { rest } from 'msw';
import { server } from '@/mocks/server';
import { WhatsNewWidget, WidgetRow } from './WhatsNewWidget';

const mockItems = [
  {
    title: 'New search filters added',
    link: '/scixblog/new-search-filters',
    pubDate: 'Mon, 01 Jun 2026 00:00:00 +0000',
    summary: 'We added faceted search filters for date range and author affiliation.',
  },
  {
    title: 'Performance improvements',
    link: '/scixblog/performance-improvements',
    pubDate: 'Thu, 15 May 2026 00:00:00 +0000',
    summary: '',
  },
];

const feedHandler = (items: typeof mockItems) =>
  rest.get('/api/whats-new', (req, res, ctx) => res(ctx.json({ items })));

const errorHandler = () => rest.get('/api/whats-new', (req, res, ctx) => res(ctx.status(500)));

describe('WhatsNewWidget', () => {
  test('renders heading', async () => {
    server.use(feedHandler(mockItems));
    render(<WhatsNewWidget />);
    expect(screen.getByRole('heading', { name: "What's New" })).toBeInTheDocument();
  });

  test('shows feed items after load', async () => {
    server.use(feedHandler(mockItems));
    render(<WhatsNewWidget />);

    await waitFor(() => {
      expect(screen.getByText('New search filters added')).toBeInTheDocument();
    });

    expect(screen.getByText('Performance improvements')).toBeInTheDocument();
    expect(screen.getByText('Jun 1, 2026')).toBeInTheDocument();
    expect(screen.getByText('May 15, 2026')).toBeInTheDocument();
  });

  test('shows summary text when present', async () => {
    server.use(feedHandler(mockItems));
    render(<WhatsNewWidget />);

    await waitFor(() => {
      expect(
        screen.getByText('We added faceted search filters for date range and author affiliation.'),
      ).toBeInTheDocument();
    });
  });

  test('items render as external links', async () => {
    server.use(feedHandler(mockItems));
    render(<WhatsNewWidget />);

    const link = await screen.findByRole('link', { name: /New search filters added/i });
    expect(link).toHaveAttribute('href', '/scixblog/new-search-filters');
  });

  test('shows empty state on server error', async () => {
    server.use(errorHandler());
    render(<WhatsNewWidget />);

    await waitFor(() => {
      expect(screen.getByText('No updates available.')).toBeInTheDocument();
    });
  });

  test('shows empty state when items array is empty', async () => {
    server.use(feedHandler([]));
    render(<WhatsNewWidget />);

    await waitFor(() => {
      expect(screen.getByText('No updates available.')).toBeInTheDocument();
    });
  });

  test('loading state shows aria-busy container', () => {
    server.use(rest.get('/api/whats-new', (req, res, ctx) => res(ctx.delay('infinite'), ctx.json({ items: [] }))));
    render(<WhatsNewWidget />);
    expect(screen.getByLabelText('Loading updates')).toBeInTheDocument();
  });
});

describe('WidgetRow', () => {
  test('renders children', () => {
    render(
      <WidgetRow>
        <div data-testid="child">widget</div>
      </WidgetRow>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
