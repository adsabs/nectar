import React from 'react';
import * as ReactDOM from 'react-dom';
import { Default as SearchExamples } from '../stories/SearchExamples.stories';

describe('SearchExamples', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<SearchExamples />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
