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
} from './types';

export enum JOURNALS_API_KEYS {
  JOURNAL = 'journals/journal',
  SUMMARY = 'journals/summary',
  ISSN = 'journals/issn',
}

export const journalsKeys = {
  journal: (params: IADSApiJournalsJournalParams) => [JOURNALS_API_KEYS.JOURNAL, params] as const,
  summary: (params: IADSApiJournalsSummaryParams) => [JOURNALS_API_KEYS.SUMMARY, params] as const,
  issn: (params: IADSApiJournalsISSNParams) => [JOURNALS_API_KEYS.ISSN, params] as const,
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
