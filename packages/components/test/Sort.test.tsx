import { render } from '@testing-library/react';
import React from 'react';
import { Default as Sort } from '../stories/Sort.stories';

describe('Sort', () => {
  it('renders without crashing', () => {
    render(<Sort {...Sort.args} />)
  });
});
