import React from 'react';
import { render } from '@testing-library/react';
import { Default as AbstractSources } from '../__stories__/AbstractSources.stories';

describe('AbstractSources', () => {
  it('renders without crashing', () => {
    render(<AbstractSources />);
  });
});
