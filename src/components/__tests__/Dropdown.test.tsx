import { IDropdownListProps } from '@components/Dropdown';
import { act, render } from '@testing-library/react';
import React from 'react';
import { Default as Dropdown } from '../__stories__/Dropdown.stories';

describe('Dropdown', () => {
  it('Renders without crashing', () => {
    act(() => {
      render(<Dropdown {...(Dropdown.args as IDropdownListProps)} />);
    });
  });
});
