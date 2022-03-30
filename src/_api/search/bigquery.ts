import { IDocsEntity } from '@api';
import { ApiTargets } from '@api/lib/models';
import api, { ApiRequestConfig } from '@_api/api';
import { ADSQuery } from '@_api/types';
import { QueryFunction, useQuery } from 'react-query';

export const getBigQueryParams = (bibcodes: IDocsEntity['bibcode'][]): IADSApiBigQueryParams => ({
  bigquery: `bibcode\n${bibcodes.join('\n')}`,
  q: '*:*',
  fq: '{!bitset}',
  sort: 'date desc',
});

export interface IADSApiBigQueryParams {
  q: string;
  fq?: string;
  bigquery?: string;
  sort: string;
}

export interface IADSApiBigQueryResponse {
  response: {
    qid: number;
  };
}

type BigQueryQuery<P = IADSApiBigQueryParams, R = IADSApiBigQueryResponse['response']> = ADSQuery<
  P,
  IADSApiBigQueryResponse,
  R
>;

export const bigqueryKeys = {
  bigquery: (bibcodes: IDocsEntity['bibcode'][]) => ['bigquery', bibcodes] as const,
};

export const useGetBigQuery: BigQueryQuery<{ bibcodes: IDocsEntity['bibcode'][] }> = ({ bibcodes }, options) => {
  const params = getBigQueryParams(bibcodes);
  return useQuery({
    queryKey: ['bigquery', params],
    queryFn: fetchBigQuery,
    meta: { params },
    // select: responseSelector,
    ...options,
  });
};

export const fetchBigQuery: QueryFunction<IADSApiBigQueryResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiBigQueryParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.MYADS_STORAGE + '/query',
    params,
  };
  const { data } = await api.request<IADSApiBigQueryResponse>(config);
  return data;
};
