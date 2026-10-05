import { renderToString } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';

import GlobalError from './global-error';

const error = Object.assign(new Error('layout exploded'), { digest: 'abc123' });

// Renders only when RootLayout itself has thrown, so this deliberately has
// no Chakra, store, or query client in scope; a new dependency on one would
// throw here instead of rendering.
describe('GlobalError', () => {
  test('renders without any provider in scope', () => {
    expect(() => renderToString(<GlobalError error={error} reset={() => undefined} />)).not.toThrow();
  });

  test('tells the user the app failed', () => {
    const html = renderToString(<GlobalError error={error} reset={() => undefined} />);

    expect(html).toContain('Application error');
  });

  test('offers a retry', () => {
    const html = renderToString(<GlobalError error={error} reset={() => undefined} />);

    expect(html).toContain('Try again');
  });

  // global-error replaces the entire document, so Next requires it to supply
  // its own html and body.
  test('supplies its own document shell', () => {
    const html = renderToString(<GlobalError error={error} reset={() => undefined} />);

    expect(html).toContain('<html');
    expect(html).toContain('<body');
  });

  test('does not leak the error message to the page', () => {
    const html = renderToString(<GlobalError error={error} reset={() => undefined} />);

    expect(html).not.toContain('layout exploded');
  });

  test('wires the retry button to the supplied reset', () => {
    const reset = vi.fn();

    const html = renderToString(<GlobalError error={error} reset={reset} />);

    expect(html).toContain('button');
    expect(reset).not.toHaveBeenCalled();
  });
});
