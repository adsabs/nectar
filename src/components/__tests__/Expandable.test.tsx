import { render, screen } from '@/test-utils';
import { test } from 'vitest';
import { Expandable } from '../Expandable';

test('renders without crashing', () => {
  render(<Expandable title="Test" description="Test" />);
});

test('opens by default when requested', () => {
  render(<Expandable title="Test" description="Visible" defaultOpen />);
  screen.getByText('Visible');
});
