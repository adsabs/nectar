import { APP_DEFAULTS } from '@/config';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';

export const defaultFields: IADSApiSearchParams['fl'] = [
  'bibcode',
  'title',
  'author',
  `[fields author=${APP_DEFAULTS.DETAILS_MAX_AUTHORS}]`,
  'author_count',
  'pubdate',
  'bibstem',
  '[citations]',
  'citation_count',
  'citation_count_norm',
  'esources',
  'property',
  'pub',
  'data',
  'id',
  'identifier',
];

export const defaultSort: IADSApiSearchParams['sort'] = ['score desc'];

export const defaultParams: IADSApiSearchParams = {
  q: '*:*',
  sort: APP_DEFAULTS.SORT,
  fl: defaultFields,
  start: 0,
  rows: APP_DEFAULTS.RESULT_PER_PAGE,
};

export const getSearchParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...defaultParams,
  ...params,
});

export const getCitationsParams = (bibcode: IDocsEntity['bibcode'], start: number): IADSApiSearchParams => ({
  ...defaultParams,
  q: `citations(identifier:"${bibcode}")`,
  start,
});

export const getReferencesParams = (bibcode: IDocsEntity['bibcode'], start: number): IADSApiSearchParams => ({
  ...defaultParams,
  q: `references(identifier:"${bibcode}")`,
  sort: ['first_author asc'],
  start,
});

export const getCoreadsParams = (bibcode: IDocsEntity['bibcode'], start: number): IADSApiSearchParams => ({
  ...defaultParams,
  q: `trending(identifier:"${bibcode}") -identifier:"${bibcode}"`,
  sort: ['score desc'],
  start,
});

export const getSimilarParams = (bibcode: IDocsEntity['bibcode'], start: number): IADSApiSearchParams => ({
  ...defaultParams,
  q: `similar(identifier:"${bibcode}")`,
  sort: ['score desc'],
  start,
});

export const getTocParams = (bibcode: IDocsEntity['bibcode'], start: number): IADSApiSearchParams => {
  const volumeId = bibcode?.[13] === 'E' ? `${bibcode?.substring(0, 14)}*` : `${bibcode?.substring(0, 13)}*`;

  return {
    ...defaultParams,
    q: `identifier:"${volumeId}"`,
    start,
  };
};

export const getAbstractParams = (id: string): IADSApiSearchParams => ({
  ...defaultParams,
  fl: [
    ...defaultFields,
    'read_count',
    'abstract',
    'comment',
    'data',
    `[fields orcid_pub=${APP_DEFAULTS.DETAILS_MAX_AUTHORS}]`,
    `[fields orcid_user=${APP_DEFAULTS.DETAILS_MAX_AUTHORS}]`,
    `[fields orcid_other=${APP_DEFAULTS.DETAILS_MAX_AUTHORS}]`,
    'orcid_pub',
    'orcid_user',
    'orcid_other',
    'doi',
    'pub_raw',
    'publisher',
    'keyword',
    'comment',
    'pubnote',
    'book_author',
    'gpn',
    'gpn_id',
  ],
  q: `identifier:"${id}"`,
});

// for getting single record in feedback form
export const getSingleRecordParams = (id: string): IADSApiSearchParams => ({
  fl: [
    'title',
    'author',
    'aff',
    'pub_raw',
    'pubdate',
    'abstract',
    'bibcode',
    'keyword',
    'orcid_pub',
    'database',
    'reference',
  ],
  q: `identifier:"${id}"`,
  rows: 1,
});

export const getAffiliationParams = (bibcode: IDocsEntity['bibcode']): IADSApiSearchParams => ({
  ...defaultParams,
  fl: ['bibcode', 'title', 'author', 'aff', 'orcid_pub', 'orcid_user', 'orcid_other', 'author_count'],
  q: `identifier:"${bibcode}"`,
});

export const getSearchFacetParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
  facet: true,
});

export const getSearchFacetJSONParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
});

export const getSearchFacetYearsParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
  'facet.pivot': 'property,year',
  facet: true,
  'facet.mincount': 1,
  'facet.limit': 2000,
});

export const getSearchFacetCitationsParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
  stats: true,
  'stats.field': 'citation_count',
  'json.facet': `{"citation_count":{"type":"terms","field":"citation_count","sort":{"index":"desc"},"limit":2000}}`,
});

export const getSearchFacetReadsParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
  stats: true,
  'stats.field': 'read_count',
  'json.facet': `{"read_count":{"type":"terms","field":"read_count","sort":{"index":"desc"},"limit":2000}}`,
});

export const getSearchStatsParams = (params: IADSApiSearchParams, field: string): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
  stats: true,
  'stats.field': field.replace(/\s(asc|desc)$/, ''),
});

export const getHighlightParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
  hl: true,
  'hl.fl': 'title,abstract,body,ack',
  'hl.maxAnalyzedChars': 150000,
  'hl.requireFieldMatch': true,
  'hl.usePhraseHighlighter': true,
});

export const getBigQueryParams = (): IADSApiSearchParams => ({
  q: '*:*',
  fl: defaultFields,
});
