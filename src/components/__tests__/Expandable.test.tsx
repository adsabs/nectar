import { render } from '@/test-utils';
import { test } from 'vitest';
import { Expandable } from '../Expandable';

test('renders without crashing', () => {
  render(<Expandable title="Test" description="Test" />);
});
