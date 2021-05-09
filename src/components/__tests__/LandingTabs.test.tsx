import { render } from '@testing-library/react';
import React from 'react';
import { Default as LandingTabs } from '../__stories__/LandingTabs.stories';

describe('LandingTabs', () => {
  it('renders without crashing', () => {
    render(<LandingTabs />);
  });
});
