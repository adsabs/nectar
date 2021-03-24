import { render } from '@testing-library/react';
import React from 'react';
import { Default as NavBar } from '../stories/NavBar.stories';

describe('NavBar', () => {
  it('renders without crashing', () => {
    render(<NavBar {...NavBar.args} />)
  });
});
