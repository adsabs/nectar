import { act, render } from '@testing-library/react';
import React from 'react';
import { Default as Dropdown, DefaultArgs as DropdownArgs } from '../stories/Dropdown.stories';

describe('Dropdown', () => {
  it('Renders without crashing', () => {
    act(() => {
      render(<Dropdown {...DropdownArgs} />);
    })
  });
});
