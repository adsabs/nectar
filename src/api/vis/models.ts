import { mapObjIndexed } from 'ramda';
import { IADSApiVisParams, IADSApiWordCloudParams } from './types';
import { IADSApiSearchParams } from '@/api/search/types';

export const defaultResultsGraphParams: IADSApiSearchParams = {
  q: '*:*',
  sort: ['date desc', 'bibcode desc'],
  fl: ['title', 'bibcode', 'citation_count', 'read_count', 'pubdate'],
  start: 0,
  rows: 1500,
};

type ParamValueType = IADSApiSearchParams[keyof IADSApiSearchParams];

const toArray = (v: ParamValueType) => (Array.isArray(v) ? v : [v]);

export const getAuthorNetworkParams = (query: IADSApiSearchParams): IADSApiVisParams => {
  // rows needs to be wrapped by array to work
  const newQuery = mapObjIndexed(toArray, query);
  return { query: [JSON.stringify(newQuery)] };
};

export const getPaperNetworkParams = (query: IADSApiSearchParams): IADSApiVisParams => {
  // rows needs to be wrapped by array to work
  const newQuery = mapObjIndexed(toArray, query);
  return { query: [JSON.stringify(newQuery)] };
};

export const getWordCloudParams = (query: IADSApiSearchParams): IADSApiWordCloudParams => {
  // values are wrapped in array according to API doc
  return mapObjIndexed(toArray, query);
};

export const getResultsGraphParams = (params: IADSApiSearchParams): IADSApiSearchParams => ({
  ...defaultResultsGraphParams,
  ...params,
});
