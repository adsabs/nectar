import React from 'react';
import { render } from '@testing-library/react';
import { Default as BibstemPicker } from '../__stories__/BibstemPicker.stories';

describe('BibstemPicker', () => {
  it('renders without crashing', () => {
    render(<BibstemPicker />);
  });
});
