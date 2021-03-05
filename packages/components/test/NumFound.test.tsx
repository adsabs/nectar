import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as NumFound } from '../stories/NumFound.stories';

describe('NumFound', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<NumFound />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
