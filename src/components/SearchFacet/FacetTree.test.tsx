import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { FacetNodeCheckbox } from './FacetTree';
import { FacetItem } from './types';

vi.mock('@/components/SearchFacet/store/FacetStore', () => ({
  useFacetStore: vi.fn((selector) => {
    const state = {
      selection: {},
      select: vi.fn(),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
  selectors: {
    select: (state: { select: () => void }) => state.select,
  },
}));

vi.mock('@/lib/useColorModeColors', () => ({
  useColorModeColors: () => ({ lightText: 'gray.700' }),
}));

const makeItem = (overrides: Partial<FacetItem> = {}): FacetItem => ({
  id: '0/Smith, J',
  val: '0/Smith, J',
  count: 42,
  parentId: '',
  level: 0,
  ...overrides,
});

describe('FacetNodeCheckbox', () => {
  it('renders the item label', () => {
    render(<FacetNodeCheckbox node={makeItem()} variant="basic" />, {});
    expect(screen.getByText('Smith, J')).toBeTruthy();
  });

  it('renders the item count', () => {
    render(<FacetNodeCheckbox node={makeItem()} variant="basic" />, {});
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders a checkbox for the item', () => {
    render(<FacetNodeCheckbox node={makeItem()} variant="basic" />, {});
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('uses val to derive the display label', () => {
    const item = makeItem({ val: '0/Jones, A', id: '0/Jones, A' });
    render(<FacetNodeCheckbox node={item} variant="basic" />, {});
    expect(screen.getByText('Jones, A')).toBeTruthy();
  });
});
