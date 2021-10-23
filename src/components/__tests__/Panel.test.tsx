import { render } from '@testing-library/react';
import { Default as Panel } from '../__stories__/Panel.stories';

describe('Panel', () => {
  it('renders without crashing', () => {
    render(<Panel label="" />);
  });
});
