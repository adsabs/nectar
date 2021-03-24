import { render, screen } from '@testing-library/react';
import React from 'react';
import { Default as NumFound, TotalCitations, TotalNormalizedCitations, WithResults } from '../stories/NumFound.stories';

describe('NumFound', () => {
  it('by default show 0 results', () => {
    render(<NumFound {...NumFound.args} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 0 results');
  });

  it('with count passed, shows correct count', () => {
    render(<WithResults {...WithResults.args} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 500 results');
  })

  it('shows total citations', () => {
    render(<TotalCitations {...TotalCitations.args} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 500 results with 100 total citations');
  })

  it('shows total normalized citations', () => {
    render(<TotalNormalizedCitations {...TotalNormalizedCitations.args} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 500 results with 100 total normalized citations');
  })
});
