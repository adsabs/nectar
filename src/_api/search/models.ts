import { IADSApiSearchParams, IDocsEntity } from '@api';
import { APP_DEFAULTS } from '@config';

export const defaultFields: IADSApiSearchParams['fl'] = [
  'bibcode',
  'title',
  'author',
  '[fields author=10]',
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

export const defaultParams: Partial<IADSApiSearchParams> = {
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
  fl: [...defaultFields, 'read_count', 'abstract', 'comment', 'data', 'orcid_pub', 'orcid_user', 'orcid_other'],
  q: `identifier:"${id}"`,
});
