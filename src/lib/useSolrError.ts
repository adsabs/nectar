import { AxiosError, isAxiosError } from 'axios';
import { IADSApiSearchResponse } from '@/api/search/types';

type SolrErrorResponse = {
  code: number;
  metadata: Array<string>;
  msg: string;
};

export enum SOLR_ERROR {
  UNKNOWN,
  FIELD_NOT_FOUND,
  SYNTAX_ERROR,
}

const isSolrErrorResponse = (error: unknown): error is SolrErrorResponse => {
  return typeof error === 'object' && error !== null && 'code' in error && 'metadata' in error && 'msg' in error;
};

export const useSolrError = (error: unknown) => {
  let solrError = error;

  // if incoming error is an axios error, extract the actual solr error from it
  if (isAxiosError(solrError)) {
    solrError = (solrError as AxiosError<IADSApiSearchResponse>)?.response?.data?.error as SolrErrorResponse;
  }

  // if incoming error is not a solr error, return unknown
  if (!isSolrErrorResponse(solrError)) {
    return { error: SOLR_ERROR.UNKNOWN };
  }

  if (solrError.msg.includes('undefined field')) {
    return {
      error: SOLR_ERROR.FIELD_NOT_FOUND,
      field: solrError.msg.split('undefined field ')[1],
    };
  }

  if (solrError.msg.includes('Syntax Error, cannot parse')) {
    return {
      error: SOLR_ERROR.SYNTAX_ERROR,
    };
  }

  return {
    error: SOLR_ERROR.UNKNOWN,
  };
};
