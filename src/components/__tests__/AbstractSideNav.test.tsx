import { render } from '@testing-library/react';
import { Default as AbstractSideNav } from '../__stories__/AbstractSideNav.stories';

describe.skip('AbstractSideNav', () => {
  it('renders without crashing', () => {
    render(<AbstractSideNav />);
  });
});
