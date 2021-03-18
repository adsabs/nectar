import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as ResultList } from '../stories/ResultList.stories';

describe('ResultList', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<ResultList />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
