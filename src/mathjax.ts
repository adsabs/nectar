import { MathJax3Config, MathJaxContext } from 'better-react-mathjax';
import { createElement, FC, ReactElement, useState, useCallback, Fragment } from 'react';
import { logger } from './logger';
import * as Sentry from '@sentry/nextjs';

const config: MathJax3Config = {
  startup: {
    elements: null,
    typeset: false,
  },
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
};

// Multiple CDN sources for fallback
const CDN_SOURCES = [
  'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js',
  'https://unpkg.com/mathjax@3.2.2/es5/tex-mml-chtml.js',
];

export const MathJaxProvider: FC = ({ children }): ReactElement => {
  const [cdnIndex, setCdnIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(
    (error: unknown) => {
      const currentCdn = CDN_SOURCES[cdnIndex];
      logger.error({ error, cdn: currentCdn, cdnIndex }, 'MathJax failed to load from CDN');

      Sentry.captureException(error, {
        tags: {
          component: 'MathJax',
          cdn: currentCdn,
          cdnIndex: cdnIndex.toString(),
        },
        level: 'warning',
      });

      // Try next CDN source if available
      if (cdnIndex < CDN_SOURCES.length - 1) {
        logger.info({ nextCdn: CDN_SOURCES[cdnIndex + 1] }, 'Attempting to load MathJax from fallback CDN');
        setCdnIndex(cdnIndex + 1);
        setHasError(false);
      } else {
        // All CDN sources failed
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
      logger.info({ cdn: CDN_SOURCES[cdnIndex], cdnIndex }, 'MathJax loaded successfully from fallback CDN');
    }
  }, [cdnIndex]);

  // If all CDNs failed, render children without MathJax
  if (hasError) {
    logger.warn('Rendering without MathJax support due to CDN failures');
    return createElement(Fragment, null, children);
  }

  return createElement(
    MathJaxContext,
    {
      version: 3,
      config,
      src: CDN_SOURCES[cdnIndex],
      onError: handleError,
      onLoad: handleLoad,
    },
    children,
  );
};
