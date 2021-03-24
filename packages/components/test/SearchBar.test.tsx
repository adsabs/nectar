import { render } from '@testing-library/react';
import React from 'react';
import { Default as SearchBar, DefaultArgs as SearchBarArgs } from '../stories/SearchBar.stories';

describe('SearchBar', () => {
  it('renders without crashing', () => {
    render(<SearchBar {...SearchBarArgs} />);
  });
});
