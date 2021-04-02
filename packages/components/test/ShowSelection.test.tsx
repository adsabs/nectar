import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as ShowSelection } from '../stories/ShowSelection.stories';

describe('ShowSelection', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<ShowSelection />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
