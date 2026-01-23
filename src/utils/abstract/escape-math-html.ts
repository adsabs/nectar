/**
 * Escapes HTML-conflicting characters (< and >) inside math delimiters.
 *
 * This prevents the browser's HTML parser from interpreting math content
 * like $10<z<12$ as containing HTML tags, which would corrupt the DOM.
 *
 * @param html - The abstract HTML string that may contain math notation
 * @returns The HTML with < and > escaped inside math delimiters
 */
export function escapeMathHtml(html: string): string {
  if (!html) {
    return '';
  }

  // Pattern matches $...$ (inline) and $$...$$ (display) math
  // Content allows escaped dollars (\$) within the math expression
  const mathPattern = /(\${1,2})((?:[^$]|\\\$)+?)(\${1,2})/g;

  return html.replace(mathPattern, (match, open, content, close) => {
    // Only process if delimiters match ($ with $ or $$ with $$)
    if (open !== close) {
      return match;
    }

    // Escape < and > inside math content
    const escapedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `${open}${escapedContent}${close}`;
  });
}
