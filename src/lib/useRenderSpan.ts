import { useEffect } from 'react';

import { IDocsEntity } from '@/api/search/types';
import { closeFacetsRenderSpan, closeResultsRenderSpan } from '@/lib/performance';

// Closes both render spans (opened in Telemetry) after the results list paints.
// Both results and facets respond to the same docs state update and render in the
// same React commit, so SimpleResultList's useEffect is a reliable proxy for both.
export function useResultsRenderSpan(docs: IDocsEntity[]): void {
  useEffect(() => {
    if (docs.length === 0) {
      return;
    }
    closeResultsRenderSpan(docs.length);
    closeFacetsRenderSpan();
  }, [docs]);
}
