import { render } from '@testing-library/react';
import { Default as Tags } from '../__stories__/Tags.stories';

describe('Tags', () => {
  it('renders without crashing', () => {
    render(<Tags />);
  });
});
