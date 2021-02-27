import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as NavBar } from '../stories/NavBar.stories';

describe('NavBar', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<NavBar />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
