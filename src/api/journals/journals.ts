import { QueryFunction, useQuery } from '@tanstack/react-query';
import api, { ApiRequestConfig } from '../api';
import { ApiTargets } from '../models';
import { ADSQuery } from '../types';
import {
  IADSApiJournalsISSNParams,
  IADSApiJournalsISSNResponse,
  IADSApiJournalsJournalParams,
  IADSApiJournalsJournalResponse,
  IADSApiJournalsSummaryParams,
  IADSApiJournalsSummaryResponse,
  IJournalSearchParams,
  IJournalSearchResponse,
} from './types';
import { TypeaheadOption } from '@/components/SearchBar/types';
import axios from 'axios';

export enum JOURNALS_API_KEYS {
  JOURNAL = 'journals/journal',
  SUMMARY = 'journals/summary',
  ISSN = 'journals/issn',
  SEARCH_TERM = 'journals/search-term',
  SEARCH_OPTIONS = 'journals/search-options',
}

export const journalsKeys = {
  journal: (params: IADSApiJournalsJournalParams) => [JOURNALS_API_KEYS.JOURNAL, params] as const,
  summary: (params: IADSApiJournalsSummaryParams) => [JOURNALS_API_KEYS.SUMMARY, params] as const,
  issn: (params: IADSApiJournalsISSNParams) => [JOURNALS_API_KEYS.ISSN, params] as const,
  searchTerm: (term: string) => [JOURNALS_API_KEYS.SEARCH_TERM, term] as const,
  searchOptions: (params: IJournalSearchParams) => [JOURNALS_API_KEYS.SEARCH_OPTIONS, params] as const,
};

export const useGetJournal: ADSQuery<IADSApiJournalsJournalParams, IADSApiJournalsJournalResponse> = (
  params,
  options,
) => {
  return useQuery({
    queryKey: journalsKeys.journal(params),
    queryFn: fetchJournal,
    meta: { params },
    ...options,
  });
};

export const fetchJournal: QueryFunction<IADSApiJournalsJournalResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiJournalsJournalParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.JOURNAL}/${params.term}`,
  };

  const { data } = await api.request<IADSApiJournalsJournalResponse>(config);
  return data;
};

export const useGetJournalSummary: ADSQuery<IADSApiJournalsSummaryParams, IADSApiJournalsSummaryResponse> = (
  params,
  options,
) => {
  return useQuery({
    queryKey: journalsKeys.summary(params),
    queryFn: fetchSummary,
    meta: { params },
    ...options,
  });
};

export const fetchSummary: QueryFunction<IADSApiJournalsSummaryResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiJournalsSummaryParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.JOURNAL_SUMMARY}/${params.bibstem}`,
  };

  const { data } = await api.request<IADSApiJournalsSummaryResponse>(config);
  return data;
};

export const useGetISSN: ADSQuery<IADSApiJournalsISSNParams, IADSApiJournalsISSNResponse> = (params, options) => {
  return useQuery({
    queryKey: journalsKeys.issn(params),
    queryFn: fetchISSN,
    meta: { params },
    ...options,
  });
};

export const fetchISSN: QueryFunction<IADSApiJournalsISSNResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiJournalsISSNParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.JOURNAL_ISSN}/${params.issn}`,
  };

  const { data } = await api.request<IADSApiJournalsISSNResponse>(config);
  return data;
};

// Journal autocomplete search functions
export const useJournalSearch: ADSQuery<IJournalSearchParams, IJournalSearchResponse> = (params, options) => {
  return useQuery({
    queryKey: journalsKeys.searchTerm(params.term),
    queryFn: fetchJournalSearch,
    meta: { params },
    ...options,
  });
};

export const fetchJournalSearch: QueryFunction<IJournalSearchResponse> = async ({ meta }) => {
  const { params } = meta as { params: IJournalSearchParams };

  const { data } = await axios.get(`/api/journals/${params.term}`);
  return data;
};

export const useJournalSearchOptions: ADSQuery<IJournalSearchParams, TypeaheadOption[]> = (params, options) => {
  return useQuery({
    queryKey: journalsKeys.searchOptions(params),
    queryFn: fetchJournalSearchOptions,
    meta: { params },
    cacheTime: 30000,
    ...options,
  });
};

export const fetchJournalSearchOptions: QueryFunction<TypeaheadOption[]> = async ({ meta }) => {
  const { params } = meta as { params: IJournalSearchParams };

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (params.fieldType) {
    queryParams.set('fieldType', params.fieldType);
  }

  const url = `/api/journals/${params.term}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const { data } = await axios.get(url);

  if (data?.journals) {
    // Convert to typeahead options
    const options = (data as IJournalSearchResponse).journals.map((journal, i) => {
      return {
        value: journal.value,
        label: journal.label,
        desc: journal.desc,
        id: i,
        match: [] as string[],
      } as TypeaheadOption;
    });
    return options;
  }

  return [];
};
