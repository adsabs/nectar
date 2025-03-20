import { render } from '@/test-utils';
import { test } from 'vitest';
import { Pager } from '../Pager';

const pages = [
  { title: 'First', content: 'Page 1', uniqueId: 'first' },
  { title: 'Second', content: 'Page 2', uniqueId: 'second' },
  { title: 'Third', content: 'Page 3', uniqueId: 'third' },
  { title: 'Fourth', content: 'Page 4', uniqueId: 'fourth' },
  { title: 'Fifth', content: 'Page 5', uniqueId: 'fifth' },
  { title: 'Sixth', content: 'Page 6', uniqueId: 'sixth' },
];

const dynamicPages = [
  { title: 'First', content: (ctx: Record<string, unknown>) => <pre>{JSON.stringify(ctx)}</pre>, uniqueId: 'first' },
  { title: 'Second', content: (ctx: Record<string, unknown>) => <pre>{JSON.stringify(ctx)}</pre>, uniqueId: 'second' },
];

test('renders without crashing', () => {
  render(<Pager initialPage={0} pages={pages} />);
});

test('renders with dynamic content', () => {
  render(<Pager initialPage={0} pages={dynamicPages} />);
});
