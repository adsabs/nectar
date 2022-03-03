import { IADSApiSearchParams, IDocsEntity } from '@api';
import { APP_DEFAULTS } from '@config';

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
  'data',
];

export const defaultSort: IADSApiSearchParams['sort'] = ['date desc'];

export const defaultParams: IADSApiSearchParams = {
  q: '*:*',
  sort: ['date desc'],
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
  const volumeId = bibcode[13] === 'E' ? `${bibcode.substring(0, 14)}*` : `${bibcode.substring(0, 13)}*`;

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
  ],
  q: `identifier:"${id}"`,
});

export const getAffiliationParams = (bibcode: IDocsEntity['bibcode']): IADSApiSearchParams => ({
  ...defaultParams,
  fl: ['bibcode', 'title', 'author', 'aff', 'orcid_pub', 'orcid_user', 'orcid_other', 'author_count'],
  q: `identifier:"${bibcode}"`,
});

export const getSearchStatsParams = (params: IADSApiSearchParams, field: string): IADSApiSearchParams => ({
  ...params,
  fl: ['id'],
  stats: true,
  'stats.field': field.replace(/\s(asc|desc)$/, ''),
});
