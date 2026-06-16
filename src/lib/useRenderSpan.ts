import { useEffect, useLayoutEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';

import { IDocsEntity } from '@/api/search/types';
import { PERF_SPANS } from '@/lib/performance';

// Paint timing for the search results list: open after DOM commit
// (useLayoutEffect), close after paint (rAF). Results and facets share one
// lifecycle — they render in the same React commit.
//
// Opt-in via `enabled`: SimpleResultList is shared (abstract refs, library
// lists), and only search should emit search.* spans. The list mounts only
// after a search completes, so a zero-result render still counts.
export function useResultsRenderSpan(docs: IDocsEntity[], enabled = false): void {
  const resultsSpanRef = useRef<ReturnType<typeof Sentry.startInactiveSpan> | null>(null);
  const facetsSpanRef = useRef<ReturnType<typeof Sentry.startInactiveSpan> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Open after DOM commit, before the browser paints.
  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    try {
      resultsSpanRef.current?.end();
      facetsSpanRef.current?.end();
      resultsSpanRef.current = Sentry.startInactiveSpan({
        name: PERF_SPANS.SEARCH_RESULTS_RENDER,
        op: 'ui.render',
      });
      facetsSpanRef.current = Sentry.startInactiveSpan({
        name: PERF_SPANS.SEARCH_FACETS_RENDER,
        op: 'ui.render',
      });
    } catch {}
  }, [docs, enabled]);

  // Close after the browser has painted.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      try {
        if (resultsSpanRef.current) {
          resultsSpanRef.current.setAttributes({ doc_count: docs.length });
          resultsSpanRef.current.setStatus({ code: 1 });
          resultsSpanRef.current.end();
          resultsSpanRef.current = null;
        }
        if (facetsSpanRef.current) {
          facetsSpanRef.current.setStatus({ code: 1 });
          facetsSpanRef.current.end();
          facetsSpanRef.current = null;
        }
      } catch {}
    });
  }, [docs, enabled]);

  // Cancel pending rAF and end any open spans on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      try {
        resultsSpanRef.current?.end();
        facetsSpanRef.current?.end();
      } catch {}
    };
  }, []);
}
