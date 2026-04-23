import * as Sentry from '@sentry/nextjs';
import { useEffect, useRef } from 'react';

import { PERF_SPANS } from '@/lib/performance';

// Tracks export generation as a user.flow span: opens on 'fetching', closes when data arrives.
export function useExportSpan(isFetching: boolean, format: string, data: unknown): void {
  const spanRef = useRef<ReturnType<typeof Sentry.startInactiveSpan> | null>(null);

  useEffect(() => {
    if (!isFetching) {
      return;
    }
    try {
      spanRef.current?.end();
      spanRef.current = Sentry.startInactiveSpan({
        name: PERF_SPANS.EXPORT_GENERATE_TOTAL,
        op: 'user.flow',
        attributes: { format },
      });
    } catch {}
    // `format` captured at fetch-start; re-running on format change would double-open the span.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetching]);

  useEffect(() => {
    if (!data || !spanRef.current) {
      return;
    }
    try {
      spanRef.current.setStatus({ code: 1 });
      spanRef.current.end();
      spanRef.current = null;
    } catch {}
  }, [data]);
}
