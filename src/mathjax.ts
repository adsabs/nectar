import { MathJax3Config, MathJaxContext } from 'better-react-mathjax';
import { createElement, FC, ReactElement, useState, useCallback, useMemo, Fragment } from 'react';
import { logger } from './logger';
import * as Sentry from '@sentry/nextjs';

// Explicit fontURL prevents auto-detection failures in dynamically
// loaded scripts that cause font-src CSP violations.
const CDN_SOURCES = [
  {
    src: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
    fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/output/chtml/fonts/woff-v2',
  },
  {
    src: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js',
    fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/output/chtml/fonts/woff-v2',
  },
];

const buildConfig = (fontURL: string): MathJax3Config => ({
  startup: {
    elements: null,
    typeset: false,
  },
  chtml: { fontURL },
  loader: { load: ['[tex]/html'] },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]'],
    ],
    processEscapes: true,
  },
});

export const MathJaxProvider: FC = ({ children }): ReactElement => {
  const [cdnIndex, setCdnIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const config = useMemo(() => buildConfig(CDN_SOURCES[cdnIndex].fontURL), [cdnIndex]);

  const handleError = useCallback(
    (error: unknown) => {
      const currentCdn = CDN_SOURCES[cdnIndex].src;
      logger.error({ error, cdn: currentCdn, cdnIndex }, 'MathJax failed to load from CDN');

      Sentry.captureException(error, {
        tags: {
          component: 'MathJax',
          cdn: currentCdn,
          cdnIndex: cdnIndex.toString(),
        },
        level: 'warning',
      });

      if (cdnIndex < CDN_SOURCES.length - 1) {
        logger.info({ nextCdn: CDN_SOURCES[cdnIndex + 1].src }, 'Attempting to load MathJax from fallback CDN');
        setCdnIndex(cdnIndex + 1);
        setHasError(false);
      } else {
        logger.error('All MathJax CDN sources failed to load');
        Sentry.captureMessage('All MathJax CDN sources failed', {
          level: 'error',
          tags: {
            component: 'MathJax',
            attemptedCdns: CDN_SOURCES.length.toString(),
          },
        });
        setHasError(true);
      }
    },
    [cdnIndex],
  );

  const handleLoad = useCallback(() => {
    if (cdnIndex > 0) {
      logger.info({ cdn: CDN_SOURCES[cdnIndex].src, cdnIndex }, 'MathJax loaded successfully from fallback CDN');
    }
  }, [cdnIndex]);

  if (hasError) {
    logger.warn('Rendering without MathJax support due to CDN failures');
    return createElement(Fragment, null, children);
  }

  return createElement(
    MathJaxContext,
    {
      version: 3,
      config,
      src: CDN_SOURCES[cdnIndex].src,
      onError: handleError,
      onLoad: handleLoad,
    },
    children,
  );
};
