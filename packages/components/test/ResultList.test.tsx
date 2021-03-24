import { render } from '@testing-library/react';
import React from 'react';
import { Default as ResultList } from '../stories/ResultList.stories';

describe('ResultList', () => {
  it('renders without crashing', () => {
    render(<ResultList {...ResultList.args} />);
  });
});
