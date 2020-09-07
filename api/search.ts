import API from './api';
import qs from 'qs';

export interface SearchParams {
  query: string;
  fields?: string;
  sort?: string;
}
const search = async ({ query, fields, sort }: SearchParams) => {
  if (query.length === 0) {
    throw new Error('No Query');
  }

  const res = await API.get<SearchPayload>('search/query', {
    params: {
      q: query,
      fl:
        fields ??
        'bibcode,title,id,pubdate,author,author_count,[fields author=10]',
      sort: sort ?? 'date desc',
    },
    paramsSerializer: (params) => {
      return qs.stringify(params);
    },
  });
  return processResponse(res.data);
};

const processResponse = (payload: SearchPayload): SearchResult => {
  const { response } = payload;

  return {
    ...response,
    docs: response.docs.map((d) => ({
      ...d,
      pubdate:
        d.pubdate &&
        d.pubdate.replace(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/, '$2/$1'),
    })),
  };
};

export default search;

export interface SearchResult extends Response {}

export interface SearchPayload {
  responseHeader: ResponseHeader;
  response: Response;
}
export interface ResponseHeader {
  status: number;
  QTime: number;
  params: Params;
}
export interface Params {
  q: string;
  fl: string;
  fq_database: string;
  start: string;
  internal_logging_params: string;
  sort: string;
  fq: string;
  rows: string;
  __filter_database_fq_database?: string[] | null;
  wt: string;
  __clearBigQuery: string;
}
export interface Response {
  numFound: number;
  start: number;
  docs: DocsEntity[];
}
export interface DocsEntity {
  identifier?: string[] | null;
  pubdate: string;
  citation_count_norm?: number;
  abstract?: string;
  links_data?: string[] | null;
  pubnote?: string[] | null;
  property?: string[] | null;
  id: string;
  page?: string[] | null;
  bibcode: string;
  author: string[];
  esources?: string[] | null;
  email?: string[] | null;
  citation_count: number;
  pub: string;
  volume?: string | null;
  doi?: string[] | null;
  keyword?: string[] | null;
  doctype: string;
  read_count?: number;
  author_count?: number;
  pub_raw?: string;
  title?: string[] | null;
  '[citations]'?: [citations];
}
export interface citations {
  num_references: number;
  num_citations: number;
}
