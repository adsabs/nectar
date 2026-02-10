import { describe, expect, it, vi } from 'vitest';
import { FeedbackDropdown, feedbackItems } from '../FeedbackDropdown';
import { ListType } from '../types';
import { render, screen } from '@/test-utils';
import { NextRouter } from 'next/router';

const createMockRouter = (initial: Partial<NextRouter> = {}): NextRouter => {
  const router: Partial<NextRouter> = {
    basePath: '',
    pathname: '/search',
    route: '/search',
    asPath: '/search?q=star',
    query: { q: 'star' },
    isReady: true,
    isLocaleDomain: false,
    isPreview: false,
    isFallback: false,
    push: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    ...initial,
  };
  return router as NextRouter;
};

let mockRouter: NextRouter;

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

const items = Object.values(feedbackItems);

describe('FeedbackDropdown', () => {
  describe('dropdown variant', () => {
    it('renders menu items as <a> elements with href', async () => {
      mockRouter = createMockRouter();

      const { user } = render(<FeedbackDropdown type={ListType.DROPDOWN} />);

      const menuButton = screen.getByRole('button', { name: /feedback/i });
      await user.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(items.length);

      for (const menuItem of menuItems) {
        expect(menuItem.tagName).toBe('A');
        expect(menuItem).toHaveAttribute('href');
      }
    });

    it('includes correct path and from query param in href', async () => {
      mockRouter = createMockRouter({ asPath: '/search?q=star' });

      const { user } = render(<FeedbackDropdown type={ListType.DROPDOWN} />);

      const menuButton = screen.getByRole('button', { name: /feedback/i });
      await user.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');

      for (const item of items) {
        const link = menuItems.find((el) => el.getAttribute('href')?.startsWith(item.path));
        expect(link).toBeDefined();
        const href = link.getAttribute('href');
        expect(href).toContain(`from=${encodeURIComponent('/search?q=star')}`);
      }
    });

    it('strips existing from param before encoding', async () => {
      mockRouter = createMockRouter({
        asPath: '/search?q=star&from=/abs/1234',
      });

      const { user } = render(<FeedbackDropdown type={ListType.DROPDOWN} />);

      const menuButton = screen.getByRole('button', { name: /feedback/i });
      await user.click(menuButton);

      const menuItems = screen.getAllByRole('menuitem');
      const href = menuItems[0].getAttribute('href');

      // The "from" value should not contain the original from param
      expect(href).not.toContain('from=%2Fabs%2F1234');
      // It should contain the cleaned path (trailing & stripped)
      expect(href).toContain(`from=${encodeURIComponent('/search?q=star')}`);
    });
  });

  describe('accordion variant', () => {
    it('renders list items with <a> elements containing href', () => {
      mockRouter = createMockRouter();

      render(<FeedbackDropdown type={ListType.ACCORDION} />);

      const links = screen.getAllByRole('menuitem');
      expect(links).toHaveLength(items.length);

      for (const link of links) {
        const anchor = link.querySelector('a');
        expect(anchor).not.toBeNull();
        expect(anchor).toHaveAttribute('href');
      }
    });

    it('calls onFinished when a link is clicked', async () => {
      mockRouter = createMockRouter();
      const onFinished = vi.fn();

      const { user } = render(<FeedbackDropdown type={ListType.ACCORDION} onFinished={onFinished} />);

      const links = screen.getAllByRole('menuitem');
      const anchor = links[0].querySelector('a');
      await user.click(anchor);

      expect(onFinished).toHaveBeenCalledTimes(1);
    });
  });
});
