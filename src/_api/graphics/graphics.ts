import { IDocsEntity } from '@api';
import { ApiTargets } from '@api/lib/models';
import { isNil } from 'ramda';
import { QueryFunction, useQuery, UseQueryOptions, UseQueryResult } from 'react-query';
import api, { ApiRequestConfig } from '../api';
import { IADSApiGraphicsResponse } from './types';

export type UseGraphicsResult = UseQueryResult<Partial<IADSApiGraphicsResponse>>;

export const graphicsKeys = {
  primary: (bibcode: IDocsEntity['bibcode']) => ['graphics', { bibcode }] as const,
};

const retryFn = (count: number, error: Error) => {
  if (count >= 3 || error.message.startsWith('No database entry')) {
    return false;
  }

  return true;
};

export const useHasGraphics = (bibcode: IDocsEntity['bibcode'], options?: UseQueryOptions): boolean => {
  const { isSuccess } = useQuery(graphicsKeys.primary(bibcode), fetchGraphics, {
    retry: retryFn,
    ...options,
  });

  return isSuccess;
};

export const useGetGraphics = (bibcode: IDocsEntity['bibcode'], options?: UseQueryOptions): UseGraphicsResult => {
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
