import { act, render } from '@testing-library/react';
import React from 'react';
import { Default as NavBar, DefaultArgs as NavBarArgs } from '../stories/NavBar.stories';

describe('NavBar', () => {
  it('renders without crashing', () => {
    act(() => {
      render(<NavBar {...NavBarArgs} />)
    })
  });
});
