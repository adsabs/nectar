import { render } from '@testing-library/react';
import { Default as Expandable } from '../__stories__/Expandable.stories';

describe('Expandable', () => {
  it('renders without crashing', () => {
    render(<Expandable title="Test" description="Test" />);
  });
});
