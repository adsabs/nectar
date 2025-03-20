import { render } from '@/test-utils';
import { test, vi } from 'vitest';
import { Pagination } from '@/components/ResultList/Pagination';

const mocks = vi.hoisted(() => ({
  useRouter: () => ({
    query: { id: 'foo' },
    asPath: '/search',
    pathname: '/search',
    push: vi.fn(),
  }),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

test('renders without crashing', () => {
  render(<Pagination page={1} totalResults={100} />);
});
