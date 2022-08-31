import { render } from '@test-utils';
import { describe, it } from 'vitest';
import { Default as Expandable } from '../__stories__/Expandable.stories';

describe('Expandable', () => {
  it('renders without crashing', () => {
    render(<Expandable title="Test" description="Test" />);
  });
});
