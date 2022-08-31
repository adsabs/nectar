import { render } from '@test-utils';
import { describe, it } from 'vitest';
import { Default as LandingTabs } from '../__stories__/LandingTabs.stories';

describe.skip('LandingTabs', () => {
  it('renders without crashing', () => {
    render(<LandingTabs />);
  });
});
