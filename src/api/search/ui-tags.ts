import { QueryKey } from '@tanstack/react-query';

import { isString } from '@/utils/common/guards';

export enum SEARCH_API_KEYS {
  primary = 'search/primary',
  preview = 'search/preview',
  infinite = 'search/infinite',
  highlight = 'search/highlight',
  abstracts = 'search/abstracts',
  bigquery = 'search/bigquery',
  abstract = 'search/abstract',
  affiliations = 'search/affiliations',
  citations = 'search/citations',
  references = 'search/references',
  credits = 'search/credits',
  mentions = 'search/mentions',
  coreads = 'search/coreads',
  similar = 'search/similar',
  toc = 'search/toc',
  stats = 'search/stats',
  facet = 'search/facet',
  record = 'search/record',
}

// Callers reusing a search hook that isn't their own surface. Doubles as the
// cache partition key and the ui_tag Solr logs.
export enum SEARCH_NAMESPACES {
  orcidProfileRecords = 'orcid/profile-records',
  // The suffix avoids colliding with OrcidKeys mutation keys.
  orcidUpdateWork = 'orcid/update-work-record',
  orcidAddWorks = 'orcid/add-works-records',
  feedbackMissingReferences = 'feedback/missing-references',
  feedbackAssociatedArticles = 'feedback/associated-articles',
  authorAffiliationsBibcodes = 'author-affiliations/bibcodes',
  metricsBatched = 'metrics/batched',
  librariesItemPreview = 'libraries/item-preview',
  settingsExportSample = 'settings/export-sample',
  citationHelperDocs = 'citation-helper/docs',
  exportCitation = 'export/citation',
}

// Solr-touching surfaces outside search (vis, vault).
export enum UI_TAGS {
  visResultsGraph = 'vis/results-graph',
  vaultExecuteQuery = 'vault/execute-query',
}

export type SearchNamespace = SEARCH_API_KEYS | SEARCH_NAMESPACES;

// Closed set: keeps an arbitrary record id from leaking into Solr's ui_tag.
const ALL_UI_TAGS = new Set<string>([
  ...Object.values(SEARCH_API_KEYS),
  ...Object.values(SEARCH_NAMESPACES),
  ...Object.values(UI_TAGS),
]);

export const resolveUiTag = (queryKey: QueryKey): string | undefined =>
  isString(queryKey[0]) && ALL_UI_TAGS.has(queryKey[0]) ? queryKey[0] : undefined;
