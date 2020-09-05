import API from './api';

const search = async (query: string) => {
  const res = await API.get<SearchPayload>(
    `search/query?q=${query}&fl=title,id,pub_date,author&sort=date%20desc`
  );
  return res.data;
};

export default search;

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
  citation_count_norm: number;
  abstract: string;
  links_data?: string[] | null;
  pubnote?: string[] | null;
  property?: string[] | null;
  id: string;
  page?: string[] | null;
  bibcode: string;
  author?: string[] | null;
  esources?: string[] | null;
  email?: string[] | null;
  citation_count: number;
  pub: string;
  volume?: string | null;
  doi?: string[] | null;
  keyword?: string[] | null;
  doctype: string;
  read_count: number;
  pub_raw: string;
  title?: string[] | null;
  '[citations]': [citations];
}
export interface citations {
  num_references: number;
  num_citations: number;
}
