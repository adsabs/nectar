import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as Sort } from '../stories/Sort.stories';

describe('Sort', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Sort />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
