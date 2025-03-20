import { render } from '@/test-utils';
import { test, vi } from 'vitest';
import { Tags } from '../Tags';

const tagItems = [
  { id: 'apple', label: 'apple' },
  { id: 'orange', label: 'orange' },
  { id: 'banana', label: 'banana' },
  { id: 'pear', label: 'pear' },
];

test('renders without crashing', () => {
  const onClear = vi.fn();
  const onRemove = vi.fn();
  render(<Tags tagItems={tagItems} onClear={onClear} onRemove={onRemove} />);
});
