import { IADSApiSearchResponse } from '@/api/search/types';

type GenerateOptions = {
  params?: Record<string, string>;
  numFound?: number;
  start?: number;
  innerResponse?: Record<string, unknown>;
  [key: string]: unknown;
};

export const generateSearchResponse = <T = IADSApiSearchResponse>(options: GenerateOptions): T => {
  const { params = {}, numFound = 0, start = 0, innerResponse, ...props } = options;

  return {
    responseHeader: {
      status: 0,
      QTime: 0,
      params,
    },
    response: {
      numFound,
      start,
      docs: [],
      ...innerResponse,
    },
    ...props,
  } as T;
};
