import { isNil } from 'ramda';
import { QueryFunction, useQuery, UseQueryResult } from '@tanstack/react-query';
import { IADSApiGraphicsParams, IADSApiGraphicsResponse } from './types';
import { IDocsEntity } from '@/api/search/types';
import { ADSQuery } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

const MAX_RETRIES = 3;

export type UseGraphicsResult = UseQueryResult<Partial<IADSApiGraphicsResponse>>;

export const graphicsKeys = {
  primary: (bibcode: IDocsEntity['bibcode']) => ['graphics', { bibcode }] as const,
};

const retryFn = (count: number, error: unknown) => {
  if (count >= MAX_RETRIES || (error instanceof Error && error.message.startsWith('No database entry'))) {
    return false;
  }

  return true;
};

/**
 * Fetches graphics and returns true if the request returns successfully
 */
export const useGetGraphicsCount: ADSQuery<
  IDocsEntity['bibcode'],
  IADSApiGraphicsResponse,
  IADSApiGraphicsResponse,
  number
> = (bibcode, options) => {
  const params = { bibcode };

  const { data } = useQuery({
    queryKey: graphicsKeys.primary(bibcode),
    queryFn: fetchGraphics,
    retry: retryFn,
    meta: { params, skipGlobalErrorHandler: true },
    ...options,
  });

  return data?.figures?.length ?? 0;
};

/**
 * Get graphics based on bibcode
 */
export const useGetGraphics: ADSQuery<IDocsEntity['bibcode'], IADSApiGraphicsResponse> = (bibcode, options) => {
  const params = { bibcode };
  return useQuery({
    queryKey: graphicsKeys.primary(bibcode),
    queryFn: fetchGraphics,
    retry: retryFn,
    meta: { params },
    ...options,
  });
};

export const fetchGraphics: QueryFunction<IADSApiGraphicsResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiGraphicsParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.GRAPHICS}/${params.bibcode}`,
  };

  const { data: graphics } = await api.request<IADSApiGraphicsResponse>(config);

  if (isNil(graphics) || graphics.Error) {
    return null;
  }

  return graphics;
};
