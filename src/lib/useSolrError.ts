import { AxiosError, isAxiosError } from 'axios';
import { IADSApiSearchResponse } from '@/api/search/types';

type SolrErrorResponse = {
  code: number; // mirrors HTTP status for errors
  metadata?: string[];
  msg: string;
  details?: unknown;
};

export enum SOLR_ERROR {
  UNKNOWN,
  FIELD_NOT_FOUND,
  SORT_FIELD_NOT_FOUND,
  CANNOT_SORT_MULTIVALUED,
  DOCVALUES_REQUIRED_FOR_SORT,
  BAD_QUERY_SYNTAX,
  BAD_RANGE_SYNTAX,
  TOO_MANY_BOOLEAN_CLAUSES,
  LOCAL_PARAMS_SYNTAX,
  UNKNOWN_QUERY_PARSER,
  UNDEFINED_FUNCTION,
  INVALID_DATE,
  INVALID_NUMBER,
  INVALID_BOOLEAN,
  PARAM_OUT_OF_RANGE_OR_MISSING,
  VERSION_CONFLICT,
  NOT_FOUND,
  UNAUTHORIZED,
  FORBIDDEN,
  SERVER_ERROR,
  SERVICE_UNAVAILABLE,
  CONFLICT,
}

export type ParsedSolrError = {
  error: SOLR_ERROR;
  originalMsg: string;
  field?: string;
};

const isSolrErrorResponse = (x: unknown): x is SolrErrorResponse =>
  typeof x === 'object' && x !== null && 'msg' in x && 'code' in x;

const pickField = (msg: string) => {
  const m = msg.match(/undefined field\s+([^\s,;]+)/i) || msg.match(/can't find sort field:\s*([^\s,;]+)/i);
  return m?.[1]?.replace(/[\"']/g, '');
};

const PATTERNS: Array<{ re: RegExp; type: SOLR_ERROR; field?: (msg: string) => string | undefined }> = [
  { re: /\bundefined field\b/i, type: SOLR_ERROR.FIELD_NOT_FOUND, field: pickField },
  { re: /sort param field can'?t be found/i, type: SOLR_ERROR.SORT_FIELD_NOT_FOUND, field: pickField },
  { re: /can(?: ?not|'?t) sort on (?:a )?multi(?:-|\s*)valued field/i, type: SOLR_ERROR.CANNOT_SORT_MULTIVALUED },
  {
    re: /can(?: ?not|'?t) sort on a field w\/?o docvalues|no docvalues for field/i,
    type: SOLR_ERROR.DOCVALUES_REQUIRED_FOR_SORT,
  },
  {
    re: /(syntax\s*error[,:\s]*cannot parse|^cannot parse\b|\bSyntaxError\b|LEADING_WILDCARD_NOT_ALLOWED|leading wildcard is not allowed)/i,
    type: SOLR_ERROR.BAD_QUERY_SYNTAX,
  },
  { re: /expected\s*'TO'|range.*expected/i, type: SOLR_ERROR.BAD_RANGE_SYNTAX },
  { re: /too\s*many\s*(boolean )?clauses/i, type: SOLR_ERROR.TOO_MANY_BOOLEAN_CLAUSES },
  { re: /local params.*end with\s*}/i, type: SOLR_ERROR.LOCAL_PARAMS_SYNTAX },
  { re: /unknown query parser/i, type: SOLR_ERROR.UNKNOWN_QUERY_PARSER },
  { re: /(unknown|undefined) function/i, type: SOLR_ERROR.UNDEFINED_FUNCTION },
  { re: /invalid date( string)?|date math/i, type: SOLR_ERROR.INVALID_DATE },
  { re: /invalid number|can'?t parse (?:long|int|float|double)/i, type: SOLR_ERROR.INVALID_NUMBER },
  { re: /invalid boolean/i, type: SOLR_ERROR.INVALID_BOOLEAN },
  {
    re: /(missing (?:param|parameter)|must be non-?negative|sort order.*(asc|desc)|rows must be|start must be)/i,
    type: SOLR_ERROR.PARAM_OUT_OF_RANGE_OR_MISSING,
  },
  { re: /version conflict/i, type: SOLR_ERROR.VERSION_CONFLICT },
];

const mapHttpCode = (code?: number): SOLR_ERROR | undefined => {
  switch (code) {
    case 401:
      return SOLR_ERROR.UNAUTHORIZED;
    case 403:
      return SOLR_ERROR.FORBIDDEN;
    case 404:
      return SOLR_ERROR.NOT_FOUND;
    case 409:
      return SOLR_ERROR.CONFLICT;
    case 500:
      return SOLR_ERROR.SERVER_ERROR;
    case 503:
      return SOLR_ERROR.SERVICE_UNAVAILABLE;
    default:
      return undefined;
  }
};

export const useSolrError = (error: unknown): ParsedSolrError => {
  let payload: unknown = error;

  if (isAxiosError(error)) {
    payload = (error as AxiosError<IADSApiSearchResponse>)?.response?.data?.error as SolrErrorResponse;
  }

  if (!isSolrErrorResponse(payload)) {
    const httpMapped = isAxiosError(error) ? mapHttpCode(error.response?.status) : undefined;
    if (httpMapped) {
      return { error: httpMapped, originalMsg: isAxiosError(error) ? error.message : 'Unknown error' };
    }
    return { error: SOLR_ERROR.UNKNOWN, originalMsg: isAxiosError(error) ? error.message : 'Unknown error' };
  }

  const { msg, code } = payload;

  for (const p of PATTERNS) {
    if (p.re.test(msg)) {
      const f = p.field?.(msg);
      return f ? { error: p.type, originalMsg: msg, field: f } : { error: p.type, originalMsg: msg };
    }
  }

  if (
    Array.isArray(payload.metadata) &&
    payload.metadata.some((m) => /org\.apache\.solr\.search\.SyntaxError|\bSyntaxError\b/i.test(m))
  ) {
    return { error: SOLR_ERROR.BAD_QUERY_SYNTAX, originalMsg: msg };
  }

  const httpMapped = mapHttpCode(code);
  if (httpMapped) {
    return { error: httpMapped, originalMsg: msg };
  }

  return { error: SOLR_ERROR.UNKNOWN, originalMsg: msg };
};
