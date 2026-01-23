import { Text, TextProps } from '@chakra-ui/react';
import { MathJax } from 'better-react-mathjax';
import { ErrorBoundary } from 'react-error-boundary';
import { escapeMathHtml } from '@/utils/abstract/escape-math-html';

export interface SafeAbstractProps extends Omit<TextProps, 'dangerouslySetInnerHTML'> {
  /** The raw abstract HTML string */
  html: string;
}

/**
 * Renders an abstract with safe math handling.
 *
 * Pre-processes math segments to escape HTML-conflicting characters,
 * wraps in MathJax for rendering, and falls back to raw text if
 * rendering fails.
 */
export function SafeAbstract({ html, ...textProps }: SafeAbstractProps) {
  if (!html) {
    return null;
  }

  const processedHtml = escapeMathHtml(html);

  return (
    <ErrorBoundary fallback={<RawFallback html={html} {...textProps} />}>
      <Text as={MathJax} dangerouslySetInnerHTML={{ __html: processedHtml }} {...textProps} />
    </ErrorBoundary>
  );
}

/**
 * Fallback component that displays raw abstract text when MathJax fails.
 */
function RawFallback({ html, ...textProps }: SafeAbstractProps) {
  // Strip HTML tags for plain text display
  const plainText = html.replace(/<[^>]*>/g, '');

  return (
    <Text {...textProps} fontStyle="italic" title="Math rendering unavailable">
      {plainText}
    </Text>
  );
}
