import api, { ADSQuery, ApiRequestConfig, ApiTargets, IADSApiGraphicsParams, IDocsEntity } from '@api';
import { isNil } from 'ramda';
import { QueryFunction, useQuery, UseQueryResult } from '@tanstack/react-query';
import { IADSApiGraphicsResponse } from './types';

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
export const useHasGraphics: ADSQuery<IDocsEntity['bibcode'], IADSApiGraphicsResponse, null, boolean> = (
  bibcode,
  options,
) => {
  const params = { bibcode };

  const { isSuccess } = useQuery({
    queryKey: graphicsKeys.primary(bibcode),
    queryFn: fetchGraphics,
    retry: retryFn,
    meta: { params, skipGlobalErrorHandler: true },
    ...options,
  });

  return isSuccess;
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

  if (isNil(graphics)) {
    throw new Error('No Graphics');
  }

  if (graphics.Error) {
    throw new Error(graphics['Error Info'] ? graphics['Error Info'] : 'No Graphics');
  }

  return graphics;
};
