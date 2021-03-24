import { render } from '@testing-library/react';
import React from 'react';
import { Default as ListBox } from '../stories/ListBox.stories';

describe('ListBox', () => {
  it('renders without crashing', () => {
    render(<ListBox {...ListBox.args} />)
  });
});
