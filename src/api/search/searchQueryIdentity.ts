import { omit } from 'ramda';

import { getSearchParams } from './models';
import { IADSApiSearchParams } from './types';
import { SEARCH_API_KEYS, SearchNamespace } from './ui-tags';

export const omitParams = (query: IADSApiSearchParams): IADSApiSearchParams =>
  omit<IADSApiSearchParams, string>(['fl', 'p'], query) as IADSApiSearchParams;

export const searchPrimaryKey = (
  params: IADSApiSearchParams,
  namespace: SearchNamespace = SEARCH_API_KEYS.primary,
): readonly [SearchNamespace, IADSApiSearchParams] => [namespace, params] as const;

export const searchQueryIdentity = (
  params: IADSApiSearchParams,
  namespace: SearchNamespace,
): { queryKey: readonly [SearchNamespace, IADSApiSearchParams]; queryHash: string } => {
  const cleanParams = omitParams(getSearchParams(params));
  const queryKey = searchPrimaryKey(cleanParams, namespace);

  return { queryKey, queryHash: JSON.stringify(queryKey) };
};
