import { render } from '@test-utils';
import { describe, it } from 'vitest';
import { Default as AbstractSideNav } from '../__stories__/AbstractSideNav.stories';

describe.skip('AbstractSideNav', () => {
  it('renders without crashing', () => {
    render(<AbstractSideNav />);
  });
});
