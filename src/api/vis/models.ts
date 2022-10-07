import { IADSApiSearchParams } from '@api/search';
import { IADSApiVisParams, IADSApiWordCloudParams } from './types';

export const defaultResultsGraphParams: IADSApiSearchParams = {
  q: '*:*',
  sort: ['date desc', 'bibcode desc'],
  fl: ['title', 'bibcode', 'citation_count', 'read_count', 'pubdate'],
  start: 0,
  rows: 1500,
};

export const getAuthorNetworkParams = ({ q, sort, rows }: IADSApiSearchParams): IADSApiVisParams => {
  // rows needs to be wrapped by array to work
  const query = JSON.stringify({ q: q, sort: sort.join(','), rows: [rows] });
  return { query: [query] };
};

export const getPaperNetworkParams = ({ q, sort, rows }: IADSApiSearchParams): IADSApiVisParams => {
  // rows needs to be wrapped by array to work
  const query = JSON.stringify({ q: q, sort: sort.join(','), rows: [rows] });
  return { query: [query] };
};

export const getWordCloudParams = ({ q, sort, rows }: IADSApiSearchParams): IADSApiWordCloudParams => {
  // values are wrapped in array according to API doc
  return { q: [q], sort: [sort.join(',')], rows: [rows] };
};

export const getResultsGraphParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...defaultResultsGraphParams,
  ...params,
});
