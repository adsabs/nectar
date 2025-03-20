import { render } from '@/test-utils';
import { test } from 'vitest';
import { TextInput } from '@/components/TextInput';

test('renders without crashing', () => {
  render(<TextInput />);
});
