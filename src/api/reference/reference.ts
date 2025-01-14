import { QueryFunction, useQuery } from '@tanstack/react-query';
import { IADSApiReferenceResponse } from './types';
import { ADSQuery } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

export enum ReferenceKeysEnum {
  TEXT = 'text',
}

export const referenceKeys = {
  [ReferenceKeysEnum.TEXT]: (text: string) => [ReferenceKeysEnum.TEXT, { text }] as const,
};

type ReferenceQuery = ADSQuery<Parameters<typeof referenceKeys[ReferenceKeysEnum.TEXT]>[0], IADSApiReferenceResponse>;

/**
 * Generic reference search, will accept raw text and make request for reference string
 */
export const useReferenceSearch: ReferenceQuery = (text, options) => {
  return useQuery({
    queryKey: referenceKeys.text(text),
    queryFn: fetchReferenceText,
    meta: { params: { text } },
    ...options,
  });
};

export const fetchReferenceText: QueryFunction<IADSApiReferenceResponse> = async ({ meta }) => {
  const { params } = meta as { params: { text: string } };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.REFERENCE}/${params.text}`,
  };

  const { data } = await api.request<IADSApiReferenceResponse>(config);
  return data;
};
