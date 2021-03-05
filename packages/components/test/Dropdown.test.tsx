import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as Dropdown } from '../stories/Dropdown.stories';

describe('Dropdown', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Dropdown />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
