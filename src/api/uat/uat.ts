import { QueryFunction, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ADSQuery } from '../types';
import { IATTermsSearchParams, IUATTermsSearchReponse } from './types';

export enum UATSearchKeys {
  TERM = 'term',
}

export const uatSearchKeys = {
  term: (term: string) => [UATSearchKeys.TERM, term] as const,
};

export const useUATTermsSearch: ADSQuery<IATTermsSearchParams, IUATTermsSearchReponse> = (params, options) => {
  return useQuery({
    queryKey: uatSearchKeys.term(params.term),
    queryFn: fetchUATTerms,
    meta: { params },
    ...options,
  });
};

export const fetchUATTerms: QueryFunction<IUATTermsSearchReponse> = async ({ meta }) => {
  const { params } = meta as { params: IATTermsSearchParams };

  try {
    const { data } = await axios.get(`/api/uat/${params.term}`);
    return data;
  } catch {
    return { error: 'error fetching UAT terms' };
  }
};
