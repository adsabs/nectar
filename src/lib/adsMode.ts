import { SolrSort } from '@/api/models';
import { IADSApiSearchParams } from '@/api/search/types';
import { sendGTMEvent } from '@next/third-parties/google';
import * as Sentry from '@sentry/nextjs';
import { uniq } from 'ramda';
import { applyFiltersToQuery } from '@/components/SearchFacet/helpers';
import { FacetLogic } from '@/components/SearchFacet/types';

export const ADS_DEFAULT_COLLECTIONS = ['astronomy', 'physics'] as const;
export const ADS_DEFAULT_SORT: SolrSort = 'date desc';
export const ADS_MODE_BLURB =
  'ADS mode sets Astrophysics discipline, defaults Astronomy + Physics collections, and Date Desc sort for new searches. Ongoing searches stay unchanged.';

const ADS_FQ_DATABASE_TOKEN = '{!type=aqp v=$fq_database}';

type ApplyAdsDefaultsArgs = {
  query: IADSApiSearchParams;
  adsModeEnabled: boolean;
};

type ApplyAdsDefaultsResult = {
  query: IADSApiSearchParams;
  applied: boolean;
};

export const applyAdsModeDefaultsToQuery = ({
  query,
  adsModeEnabled,
}: ApplyAdsDefaultsArgs): ApplyAdsDefaultsResult => {
  if (!adsModeEnabled) {
    return { query, applied: false };
  }

  const existingFq = Array.isArray(query.fq) ? query.fq : [];
  const queryWithoutAdsDb: IADSApiSearchParams = {
    ...query,
    fq: existingFq.filter((fqEntry) => fqEntry !== ADS_FQ_DATABASE_TOKEN),
  };

  const { fq, fq_database } = applyFiltersToQuery({
    field: 'database',
    logic: 'or' as FacetLogic,
    values: ADS_DEFAULT_COLLECTIONS as unknown as string[],
    query: queryWithoutAdsDb,
  });

  const queryWithDefaults: IADSApiSearchParams = {
    ...queryWithoutAdsDb,
    sort: [ADS_DEFAULT_SORT, ...(query.sort?.slice(1) ?? [])],
    fq: uniq(fq),
    fq_database,
  };

  return { query: queryWithDefaults, applied: true };
};

export const trackAdsDefaultsApplied = (source: string) => {
  sendGTMEvent({
    event: 'ads_defaults_applied',
    ads_mode: true,
    source,
    collections: ADS_DEFAULT_COLLECTIONS,
    sort: ADS_DEFAULT_SORT,
  });
  Sentry.addBreadcrumb({
    category: 'ads_mode',
    level: 'info',
    message: 'ADS defaults applied',
    data: { source },
  });
};
