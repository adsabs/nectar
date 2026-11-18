import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { track } from '@/lib/analytics';
import { IDocsEntity } from '@/api/search/types';

/**
 * Hook to fire GTM + Sentry analytics when viewing an abstract detail page.
 */
export const useTrackAbstractView = (doc: IDocsEntity | undefined | null) => {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!doc || hasTracked.current) {
      return;
    }

    const { bibcode, title, pub: journal, doctype, database = [] } = doc;

    database.forEach((db) => {
      const payload = {
        item_id: bibcode,
        item_name: title?.[0] ?? bibcode,
        item_brand: journal,
        item_category: db,
        item_variant: doctype,
        quantity: 1,
      };

      track('view_item', {
        ecommerce: {
          items: [payload],
        },
      });

      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `view_item fired for ${bibcode}`,
        level: 'info',
        data: payload,
      });
    });

    hasTracked.current = true;
  }, [doc]);
};
