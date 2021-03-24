import { render } from '@testing-library/react';
import React from 'react';
import { Default as SearchBar } from '../stories/SearchBar.stories';

describe('SearchBar', () => {
  it('renders without crashing', () => {
    render(<SearchBar {...SearchBar.args} />);
  });
});
