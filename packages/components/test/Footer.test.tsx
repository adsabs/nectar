import { render } from '@testing-library/react';
import React from 'react';
import { Default as Footer, DefaultArgs as FooterArgs } from '../stories/Footer.stories';

describe('Footer', () => {
  it('renders without crashing', () => {
    render(<Footer {...FooterArgs} />)
  });
});
