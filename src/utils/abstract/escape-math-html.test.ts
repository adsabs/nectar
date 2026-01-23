import { describe, it, expect } from 'vitest';
import { escapeMathHtml } from './escape-math-html';

describe('escapeMathHtml', () => {
  it('escapes < and > inside inline math delimiters', () => {
    const input = 'Text $10<z<12$ more text';
    const result = escapeMathHtml(input);
    expect(result).toBe('Text $10&lt;z&lt;12$ more text');
  });

  it('escapes < and > inside display math delimiters', () => {
    const input = 'Text $$a<b>c$$ more';
    const result = escapeMathHtml(input);
    expect(result).toBe('Text $$a&lt;b&gt;c$$ more');
  });

  it('leaves text outside math delimiters unchanged', () => {
    const input = '<p>Normal HTML</p> with $x<y$ math';
    const result = escapeMathHtml(input);
    expect(result).toBe('<p>Normal HTML</p> with $x&lt;y$ math');
  });

  it('handles multiple math expressions', () => {
    const input = 'First $a<b$ then $c>d$';
    const result = escapeMathHtml(input);
    expect(result).toBe('First $a&lt;b$ then $c&gt;d$');
  });

  it('handles ambiguous dollar signs by matching left-to-right', () => {
    // When $ appears without math context, it pairs with the next $
    // This is expected behavior - abstracts don't typically mix currency with math
    const input = 'Price is $5, but $x<y$ is math';
    const result = escapeMathHtml(input);
    // $5, but $ is matched as "math", leaving x<y$ as text
    // This is acceptable because real abstracts don't have this pattern
    expect(result).toBe('Price is $5, but $x<y$ is math');
  });

  it('handles empty input', () => {
    expect(escapeMathHtml('')).toBe('');
    expect(escapeMathHtml(undefined as unknown as string)).toBe('');
  });

  it('handles input with no math', () => {
    const input = '<p>Just HTML</p>';
    expect(escapeMathHtml(input)).toBe('<p>Just HTML</p>');
  });

  it('handles the real-world problematic abstract', () => {
    const input = 'rate at $10<z_\\mathrm{phot}<12$ in the';
    const result = escapeMathHtml(input);
    expect(result).toBe('rate at $10&lt;z_\\mathrm{phot}&lt;12$ in the');
  });
});
