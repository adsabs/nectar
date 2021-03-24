import { render } from '@testing-library/react';
import React from 'react';
import { Default as SearchExamples } from '../stories/SearchExamples.stories';

describe('SearchExamples', () => {
  it('renders without crashing', () => {
    render(<SearchExamples {...SearchExamples.args} />)
  });
});
