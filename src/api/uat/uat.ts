import { TypeaheadOption } from '@/components/SearchBar/types';
import { QueryFunction, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ADSQuery } from '../types';
import { IATTermsSearchParams, IUATTermsSearchReponse } from './types';

export enum UATSearchKeys {
  TERM = 'term',
  OPTIONS = 'options',
}

export const uatSearchKeys = {
  term: (term: string) => [UATSearchKeys.TERM, term] as const,
  options: (term: string) => [UATSearchKeys.OPTIONS, term] as const,
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

  const { data } = await axios.get(`/api/uat/${params.term}`);
  return data;
};

export const useUATTermsSearchOptions: ADSQuery<IATTermsSearchParams, TypeaheadOption[]> = (params, options) => {
  return useQuery({
    queryKey: uatSearchKeys.options(params.term),
    queryFn: fetchUATTermOptions,
    meta: { params },
    cacheTime: 30000,
    ...options,
  });
};

export const fetchUATTermOptions: QueryFunction<TypeaheadOption[]> = async ({ meta }) => {
  const { params } = meta as { params: IATTermsSearchParams };

  const { data } = await axios.get(`/api/uat/${params.term}`);
  if (!!data?.uatTerms) {
    // convert to typeahead options
    const options = (data as IUATTermsSearchReponse).uatTerms.map((r, i) => {
      return {
        value: `"${r.name}"`,
        label: r.name,
        desc: [...(r.altNames || [])].join(', '),
        id: i,
        match: [] as string[],
      } as TypeaheadOption;
    });
    return options;
  }

  return [];
};
