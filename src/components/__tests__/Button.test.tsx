import { render } from '@testing-library/react';
import { Default as Button } from '../__stories__/Button.stories';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button />);
  });
});
