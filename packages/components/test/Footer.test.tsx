import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as Footer } from '../stories/Footer.stories';

describe('Footer', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Footer />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
