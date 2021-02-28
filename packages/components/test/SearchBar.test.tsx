import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as SearchBar } from '../stories/SearchBar.stories';

describe('SearchBar', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<SearchBar />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
