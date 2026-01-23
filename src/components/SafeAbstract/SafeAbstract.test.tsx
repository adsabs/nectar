import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SafeAbstract } from './SafeAbstract';

// Configurable mock - can be set to throw for error testing
let shouldMathJaxThrow = false;

vi.mock('better-react-mathjax', () => ({
  MathJax: ({ children, ...props }: { children?: React.ReactNode }) => {
    if (shouldMathJaxThrow) {
      throw new Error('MathJax failed');
    }
    return (
      <span data-testid="mathjax" {...props}>
        {children}
      </span>
    );
  },
}));

describe('SafeAbstract', () => {
  beforeEach(() => {
    shouldMathJaxThrow = false;
  });

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

describe('SafeAbstract error handling', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress error boundary console.error spam during tests
    console.error = vi.fn();
    shouldMathJaxThrow = true;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    shouldMathJaxThrow = false;
  });

  it('shows fallback when MathJax throws', () => {
    render(<SafeAbstract html="Some <em>math</em> here" />);

    // Should show plain text fallback (HTML tags stripped)
    expect(screen.getByText('Some math here')).toBeInTheDocument();
    // Fallback has italic styling and title attribute
    expect(screen.getByTitle('Math rendering unavailable')).toBeInTheDocument();
  });
});
