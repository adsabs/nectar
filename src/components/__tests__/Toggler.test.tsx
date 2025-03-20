import { render } from '@testing-library/react';
import { test } from 'vitest';
import { Toggler } from '@/components/Toggler';

test('renders without crashing', () => {
  render(<Toggler />);
});
