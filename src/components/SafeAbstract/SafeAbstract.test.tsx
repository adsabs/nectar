import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SafeAbstract } from './SafeAbstract';

// Mock MathJax to avoid CDN loading in tests
vi.mock('better-react-mathjax', () => ({
  MathJax: ({ children, ...props }: { children?: React.ReactNode }) => (
    <span data-testid="mathjax" {...props}>
      {children}
    </span>
  ),
}));

describe('SafeAbstract', () => {
  it('renders abstract text', () => {
    render(<SafeAbstract html="Simple abstract text" />);
    expect(screen.getByText('Simple abstract text')).toBeInTheDocument();
  });

  it('renders with MathJax wrapper', () => {
    render(<SafeAbstract html="Text with $math$" />);
    expect(screen.getByTestId('mathjax')).toBeInTheDocument();
  });

  it('handles empty/undefined abstract', () => {
    const { container } = render(<SafeAbstract html="" />);
    expect(container.textContent).toBe('');
  });

  it('escapes HTML inside math before rendering', () => {
    const { container } = render(<SafeAbstract html="$10<z<12$" />);
    // The < should be escaped so the full content renders
    expect(container.innerHTML).toContain('&lt;');
  });
});
