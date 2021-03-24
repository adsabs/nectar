import { render, screen } from '@testing-library/react';
import React from 'react';
import { Default as NumFound, DefaultArgs as NumFoundArgs, TotalCitations, TotalCitationsArgs, TotalNormalizedCitations, TotalNormalizedCitationsArgs, WithResults, WithResultsArgs } from '../stories/NumFound.stories';

describe('NumFound', () => {
  it('by default show 0 results', () => {
    render(<NumFound {...NumFoundArgs} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 0 results');
  });

  it('with count passed, shows correct count', () => {
    render(<WithResults {...WithResultsArgs} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 500 results');
  })

  it('shows total citations', () => {
    render(<TotalCitations {...TotalCitationsArgs} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 500 results with 100 total citations');
  })

  it('shows total normalized citations', () => {
    render(<TotalNormalizedCitations {...TotalNormalizedCitationsArgs} />);
    const text = screen.getByRole('status').textContent;
    expect(text).toBe('Your search returned 500 results with 100 total normalized citations');
  })
});
