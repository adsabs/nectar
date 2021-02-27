import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as Layout } from '../stories/Layout.stories';

describe('Layout', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Layout />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
