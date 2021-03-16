export interface IADSApiSearchParams {
  q: string;
  fl?: Solr.Field[];
  rows?: number;
  sort?: Solr.Sort[];
}

export interface INormalizedADSApiSearchParams {
  q: string;
  fl?: string;
  rows?: number;
  sort?: string;
}

export interface IADSApiSearchResponse {
  response: {
    numFound: number;
    start: number;
    docs: IDocsEntity[];
  };
}

interface IDocsEntity {
  abstract: string;
  ack: string;
  aff: string;
  aff_id: string;
  alternate_bibcode: string;
  alternate_title: string;
  arxiv_class: string;
  author: string;
  author_count: string;
  author_facet: string;
  author_facet_hier: string;
  author_norm: string;
  bibcode: string;
  bibgroup: string;
  bibgroup_facet: string;
  bibstem: string;
  bibstem_facet: string;
  body: string;
  citation: string;
  citation_count: string;
  cite_read_boost: string;
  classic_factor: string;
  comment: string;
  copyright: string;
  data: string;
  data_facet: string;
  database: string;
  date: string;
  doctype: string;
  doctype_facet_hier: string;
  doi: string;
  eid: string;
  email: string;
  entdate: string;
  entry_date: string;
  esources: string;
  facility: string;
  first_author: string;
  first_author_facet_hier: string;
  first_author_norm: string;
  grant: string;
  grant_agencies: string;
  grant_facet_hier: string;
  grant_id: string;
  id: string;
  identifier: string;
  ids_data: string;
  indexstamp: string;
  inst: string;
  isbn: string;
  issn: string;
  issue: string;
  keyword: string;
  keyword_facet: string;
  keyword_norm: string;
  keyword_schema: string;
  lang: string;
  links_data: string;
  nedid: string;
  nedtype: string;
  nedtype_object_facet_hier: string;
  orcid_other: string;
  orcid_pub: string;
  orcid_user: string;
  page: string;
  page_count: string;
  page_range: string;
  property: string;
  pub: string;
  pub_raw: string;
  pubdate: string;
  pubnote: string;
  read_count: string;
  reader: string;
  recid: string;
  reference: string;
  simbad_object_facet_hier: string;
  simbid: string;
  simbtype: string;
  thesis: string;
  title: string;
  vizier: string;
  vizier_facet: string;
  volume: string;
  year: string;
  abs: string;
  all: string;
  arxiv: string;
}

export interface IADSApiSearchErrorResponse {
  error: string;
}
