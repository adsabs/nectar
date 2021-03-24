import { render } from '@testing-library/react';
import React from 'react';
import { Default as Dropdown } from '../stories/Dropdown.stories';

describe('Dropdown', () => {
  it('renders without crashing', () => {
    const html = render(<Dropdown {...Dropdown.args} />);
    expect(html).toMatchInlineSnapshot(``)
  });
});
