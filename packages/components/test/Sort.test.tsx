import { render } from '@testing-library/react';
import React from 'react';
import { Default as Sort, DefaultArgs as SortArgs } from '../stories/Sort.stories';

describe('Sort', () => {
  it('renders without crashing', () => {
    render(<Sort {...SortArgs} />)
  });
});
