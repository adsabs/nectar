import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { SafeAbstract } from './SafeAbstract';

// Mock MathJax - passes through HTML content for testing
vi.mock('better-react-mathjax', () => ({
  MathJax: ({ children, ...props }: { children?: ReactNode }) => (
    <span data-testid="mathjax" {...props}>
      {children}
    </span>
  ),
}));

describe('SafeAbstract integration', () => {
  // Real-world abstract that caused the truncation bug
  const problematicAbstract = `We report a galaxy overdensity candidate at $z\\approx 10.5$ in the JWST Advanced Deep Extragalactic Survey (JADES). This overdensity contains 18 galaxies with consistent photometric redshifts and robust F115W dropouts within 8 comoving Mpc in projection. The galaxy number density is four times higher than the field expectation, accounting for one-third of comparably bright galaxies and nearly 50% of the total star formation rate at $10<z_\\mathrm{phot}<12$ in the GOODS-S field.`;

  it('renders the full problematic abstract without truncation', () => {
    render(<SafeAbstract html={problematicAbstract} />);

    // Key assertion: the text AFTER the problematic math should be present
    expect(screen.getByText(/GOODS-S field/)).toBeInTheDocument();
  });

  it('preserves all text content even with complex math', () => {
    const { container } = render(<SafeAbstract html={problematicAbstract} />);

    // Full text should be present (excluding HTML tags)
    const textContent = container.textContent || '';
    expect(textContent).toContain('JWST Advanced Deep Extragalactic Survey');
    expect(textContent).toContain('GOODS-S field');
  });
});
