import { IDocsEntity } from '@api';
import { ApiTargets } from '@api/lib/models';
import { ADSQuery } from '@_api/types';
import { isNil } from 'ramda';
import { QueryFunction, useQuery, UseQueryResult } from 'react-query';
import api, { ApiRequestConfig } from '../api';
import { IADSApiGraphicsResponse } from './types';

const MAX_RETRIES = 3;

export type UseGraphicsResult = UseQueryResult<Partial<IADSApiGraphicsResponse>>;

export const graphicsKeys = {
  primary: (bibcode: IDocsEntity['bibcode']) => ['graphics', { bibcode }] as const,
};

const retryFn = (count: number, error: Error) => {
  if (count >= MAX_RETRIES || error.message.startsWith('No database entry')) {
    return false;
  }

  return true;
};

/**
 * Fetches graphics and returns true if the request returns successfully
 */
export const useHasGraphics: ADSQuery<IDocsEntity['bibcode'], boolean> = (bibcode, options) => {
  const { isSuccess } = useQuery(graphicsKeys.primary(bibcode), fetchGraphics, {
    retry: retryFn,
    ...options,
  });

  return isSuccess;
};

/**
 * Get graphics based on bibcode
 */
export const useGetGraphics: ADSQuery<IDocsEntity['bibcode'], UseGraphicsResult> = (bibcode, options) => {
  return useQuery(graphicsKeys.primary(bibcode), fetchGraphics, {
    retry: retryFn,
    ...options,
  });
};

export const fetchGraphics: QueryFunction<
  IADSApiGraphicsResponse,
  Readonly<[string, { bibcode: IDocsEntity['bibcode'] }]>
> = async ({ queryKey }) => {
  const [, { bibcode }] = queryKey;
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.GRAPHICS}/${bibcode}`,
  };

  const { data: graphics } = await api.request<IADSApiGraphicsResponse>(config);

  if (isNil(graphics)) {
    throw new Error('No Graphics');
  }

  if (graphics.Error) {
    throw new Error(graphics['Error Info'] ? graphics['Error Info'] : 'No Graphics');
  }

  return graphics;
};
