import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as ListBox } from '../stories/ListBox.stories';

describe('ListBox', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<ListBox />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
