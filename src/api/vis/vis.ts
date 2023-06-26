import api, { ADSQuery, ApiRequestConfig } from '@api';
import { ApiTargets } from '@api/models';
import {
  IADSApiAuthorNetworkResponse,
  IADSApiPaperNetworkResponse,
  IADSApiVisParams,
  IADSApiWordCloudParams,
  IADSApiWordCloudResponse,
} from './types';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@api/search';
import { QueryFunction, useQuery } from '@tanstack/react-query';
import { getAuthorNetworkParams, getPaperNetworkParams, getResultsGraphParams, getWordCloudParams } from './models';

const MAX_RETRIES = 3;

export const visKeys = {
  authorNetwork: (params: IADSApiVisParams) => ['vis/authorNetwork', { ...params }] as const,
  paperNetwork: (params: IADSApiVisParams) => ['vis/paperNetwork', { ...params }] as const,
  wordCloud: (params: IADSApiWordCloudParams) => ['vis/wordCloud', { ...params }] as const,
  resultsGraph: (params: IADSApiSearchParams) => ['vis/resultsGraph', params] as const,
};

const retryFn = (count: number) => {
  if (count >= MAX_RETRIES) {
    return false;
  }

  return true;
};

export const useGetAuthorNetwork: ADSQuery<IADSApiSearchParams, IADSApiAuthorNetworkResponse> = (params, options) => {
  const authorNetworkParams = getAuthorNetworkParams(params);

  return useQuery({
    queryKey: visKeys.authorNetwork(authorNetworkParams),
    queryFn: fetchAuthorNetwork,
    retry: retryFn,
    meta: { params: authorNetworkParams },
    ...options,
  });
};

export const fetchAuthorNetwork: QueryFunction<IADSApiAuthorNetworkResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiVisParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_AUTHOR_NETWORK,
    data: params,
  };

  const { data } = await api.request<IADSApiAuthorNetworkResponse>(config);
  return data;
};

export const useGetPaperNetwork: ADSQuery<IADSApiSearchParams, IADSApiPaperNetworkResponse> = (params, options) => {
  const paperNetworkParams = getPaperNetworkParams(params);

  return useQuery({
    queryKey: visKeys.paperNetwork(paperNetworkParams),
    queryFn: fetchPaperNetwork,
    retry: retryFn,
    meta: { params: paperNetworkParams },
    ...options,
  });
};

export const fetchPaperNetwork: QueryFunction<IADSApiPaperNetworkResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiVisParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_PAPER_NETWORK,
    data: params,
  };

  const { data } = await api.request<IADSApiPaperNetworkResponse>(config);
  return data;
};

export const useGetWordCloud: ADSQuery<IADSApiSearchParams, IADSApiWordCloudResponse> = (params, options) => {
  const wordCloudParams = getWordCloudParams(params);

  return useQuery({
    queryKey: visKeys.wordCloud(wordCloudParams),
    queryFn: fetchWordCloud,
    retry: retryFn,
    meta: { params: wordCloudParams },
    ...options,
  });
};

export const fetchWordCloud: QueryFunction<IADSApiWordCloudResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiWordCloudParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_WORDCLOUD,
    data: params,
  };

  const { data } = await api.request<IADSApiWordCloudResponse>(config);
  return data;
};

export const useGetResultsGraph: ADSQuery<IADSApiSearchParams, IADSApiSearchResponse> = (params, options) => {
  const resultsGraphParams = getResultsGraphParams(params);

  return useQuery({
    queryKey: visKeys.resultsGraph(resultsGraphParams),
    queryFn: fetchResultsGraph,
    retry: retryFn,
    meta: { params: resultsGraphParams },
    ...options,
  });
};

export const fetchResultsGraph: QueryFunction<IADSApiSearchResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params,
  };

  const { data } = await api.request<IADSApiSearchResponse>(config);
  return data;
};
