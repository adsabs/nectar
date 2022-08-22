import { SolrField, SolrSort } from '../models';

export interface IADSApiSearchParams {
  bigquery?: string;
  cursorMark?: string;
  'facet.field'?: string;
  'facet.limit'?: number;
  'facet.mincount'?: number;
  'facet.offset'?: number;
  'facet.pivot'?: string;
  'facet.prefix'?: string;
  'facet.query'?: string;
  facet?: boolean;
  fl?: SolrField[];
  fq?: string[];
  'hl.fl'?: string;
  'hl.maxAnalyzedChars'?: number;
  'hl.requireFieldMatch'?: boolean;
  'hl.usePhraseHighlighter'?: boolean;
  hl?: boolean;
  'json.facet'?: string;
  q: string;
  rows?: number;
  sort?: SolrSort[];
  start?: number;
  'stats.field'?: string;
  stats?: boolean;
}

export interface INormalizedADSApiSearchParams {
  q: string;
  fl?: string;
  rows?: number;
  sort?: string;
}

interface IADSApiSearchResponseHeader {
  status: number;
  params: IADSApiSearchParams;
}

interface IADSApiSearchResponseError {
  code: number;
  metadata: string[];
  msg: string;
}

export interface IADSApiSearchResponse {
  response: {
    numFound: number;
    docs: IDocsEntity[];
  };
  stats?: ISearchStatsFields;
  facets?: IFacetFields;
  facet_counts?: IFacetCountsFields;
  responseHeader?: IADSApiSearchResponseHeader;
  error?: IADSApiSearchResponseError;
  nextCursorMark?: string;
  highlighting?: Record<number, Partial<Record<string, string[]>>>;
}

export interface IHighlight {
  abstract?: string[];
  title?: string[];
}
export interface ISearchStatsFields {
  stats_fields: {
    citation_count?: ISearchStats;
    citation_count_norm?: ISearchStats;
    read_count?: ISearchStats;
  };
}

export interface ISearchStats {
  count: number;
  max: number;
  mean: number;
  min: number;
  missing: number;
  stddev: number;
  sum: number;
  sumOfSquares: number;
}

export interface IFacetFields {
  count?: number;
  citation_count?: { buckets: IBucket[] };
  read_count?: { buckets: IBucket[] };
}

export interface IBucket {
  val: number;
  count: number;
}

export type FacetField =
  | 'author_facet'
  | 'bibgroup_facet'
  | 'bibstem_facet'
  | 'data_facet'
  | 'keyword_facet'
  | 'vizier_facet'
  | 'property'
  | 'database'
  | 'aff_facet_hier'
  | 'author_facet_hier'
  | 'doctype_facet_hier'
  | 'first_author_facet_hier'
  | 'first_author_facet_hier'
  | 'grant_facet_hier'
  | 'ned_object_facet_hier'
  | 'nedtype_object_facet_hier'
  | 'simbad_object_facet_hier';

export interface IFacetCountsFields {
  facet_queries: unknown;
  facet_fields: Record<FacetField, Array<string | number>>;
  facet_ranges: unknown;
  facet_intervals: unknown;
  facet_heatmaps: unknown;
  facet_pivot?: IFacetPivotFields;
}

export interface IFacetPivotFields {
  'property,year': {
    count: number;
    field: string;
    value: string;
    pivot: { field: string; value: string; count: number }[];
  }[];
}

export enum Esources {
  INSTITUTION = 'INSTITUTION',
  AcA = 'AcA',
  ADS_PDF = 'ADS_PDF',
  ADS_SCAN = 'ADS_SCAN',
  ALMA = 'ALMA',
  ARI = 'ARI',
  Astroverse = 'Astroverse',
  ATNF = 'ATNF',
  Author = 'Author',
  AUTHOR_HTML = 'AUTHOR_HTML',
  AUTHOR_PDF = 'AUTHOR_PDF',
  BAVJ = 'BAVJ',
  BICEP2 = 'BICEP2',
  CADC = 'CADC',
  CDS = 'CDS',
  Chandra = 'Chandra',
  Dataverse = 'Dataverse',
  Dryad = 'Dryad',
  EPRINT_HTML = 'EPRINT_HTML',
  EPRINT_PDF = 'EPRINT_PDF',
  ESA = 'ESA',
  ESO = 'ESO',
  Figshare = 'Figshare',
  GCPD = 'GCPD',
  Github = 'Github',
  GTC = 'GTC',
  HEASARC = 'HEASARC',
  Herschel = 'Herschel',
  IBVS = 'IBVS',
  INES = 'INES',
  IRSA = 'IRSA',
  ISO = 'ISO',
  JWST = 'JWST',
  KOA = 'KOA',
  MAST = 'MAST',
  NED = 'NED',
  NExScI = 'NExScI',
  NOAO = 'NOAO',
  PANGAEA = 'PANGAEA',
  PASA = 'PASA',
  PDG = 'PDG',
  PDS = 'PDS',
  protocols = 'protocols',
  PUB_HTML = 'PUB_HTML',
  PUB_PDF = 'PUB_PDF',
  SIMBAD = 'SIMBAD',
  Spitzer = 'Spitzer',
  TNS = 'TNS',
  Vizier = 'Vizier',
  XMM = 'XMM',
  Zenodo = 'Zenodo',
}

export interface IDocsEntity {
  /**
   * Virtual field to search across title, keyword, abstract fields in one operation
   */
  abs?: string;
  abstract?: string;
  ack?: string;
  aff_id?: string;
  aff?: string[];
  all?: string;
  alternate_bibcode?: string;
  alternate_title?: string;
  arxiv_class?: string;
  arxiv?: string;
  author_count?: number;
  author_facet_hier?: string;
  author_facet?: string;
  author_norm?: string;
  author?: string[];
  bibcode?: string;
  bibgroup_facet?: string;
  bibgroup?: string;
  bibstem_facet?: string;
  bibstem?: string[];
  body?: string;
  book_author?: string[];
  citation_count_norm?: number;
  citation_count?: number;
  citation?: string;
  '[citations]'?: {
    num_citations?: number;
    num_references?: number;
  };
  cite_read_boost?: string;
  classic_factor?: string;
  comment?: string[];
  copyright?: string;
  data_facet?: string;
  data?: string[];
  database?: string;
  date?: string;
  doctype_facet_hier?: string;
  doctype?: string;
  doi?: string;
  eid?: string;
  email?: string;
  entdate?: string;
  entry_date?: string;
  esources?: Esources[];
  facility?: string;
  first_author_facet_hier?: string;
  first_author_norm?: string;
  first_author?: string;
  grant_agencies?: string;
  grant_facet_hier?: string;
  grant_id?: string;
  grant?: string;
  id?: string;
  identifier?: string[];
  ids_data?: string;
  indexstamp?: string;
  inst?: string;
  isbn?: string;
  issn?: string;
  issue?: string;
  keyword_facet?: string;
  keyword_norm?: string;
  keyword_schema?: string;
  keyword?: string[];
  lang?: string;
  links_data?: string[];
  nedid?: string;
  nedtype_object_facet_hier?: string;
  nedtype?: string;
  orcid_other?: string[];
  orcid_pub?: string[];
  orcid_user?: string[];
  page_count?: string;
  page_range?: string;
  page?: string;
  property?: string[];
  pub_raw?: string;
  pub?: string;
  pubdate?: string;
  pubnote?: string;
  read_count?: number;
  reader?: string;
  recid?: number;
  reference?: string;
  references_count?: number;
  simbad_object_facet_hier?: string;
  simbid?: string;
  simbtype?: string;
  thesis?: string;
  title?: string[];
  vizier_facet?: string;
  vizier?: string;
  volume?: string;
  year?: string;
}

export type Bibcode = IDocsEntity['bibcode'];

export interface IDocument {
  error?: string;
  notFound?: boolean;
  doc?: IDocsEntity;
}

export interface IADSApiSearchErrorResponse {
  error: string;
}

export type QueryOperator =
  | 'citations'
  | 'pos'
  | 'references'
  | 'reviews'
  | 'similar'
  | 'topn'
  | 'trending'
  | 'useful'
  | 'docs';

export type QueryField =
  | '_version_'
  | 'abs'
  | 'abstract'
  | 'ack'
  | 'aff'
  | 'aff_abbrev'
  | 'aff_canonical'
  | 'aff_facet_hier'
  | 'aff_id'
  | 'affil'
  | 'alternate_bibcode'
  | 'alternate_title'
  | 'arxiv_class'
  | 'author'
  | 'author_count'
  | 'author_facet'
  | 'author_facet_hier'
  | 'author_norm'
  | 'bibcode'
  | 'bibgroup'
  | 'bibgroup_facet'
  | 'bibstem'
  | 'bibstem_facet'
  | 'body'
  | 'book_author'
  | 'caption'
  | 'citation'
  | 'citation_count'
  | 'citation_count_norm'
  | 'cite_read_boost'
  | 'classic_factor'
  | 'comment'
  | 'copyright'
  | 'data'
  | 'data_facet'
  | 'database'
  | 'date'
  | 'doctype'
  | 'doctype_facet_hier'
  | 'doi'
  | 'editor'
  | 'eid'
  | 'email'
  | 'entdate'
  | 'entry_date'
  | 'esources'
  | 'facility'
  | 'first_author'
  | 'first_author_facet_hier'
  | 'first_author_norm'
  | 'fulltext_mtime'
  | 'grant'
  | 'grant_facet_hier'
  | 'id'
  | 'identifier'
  | 'indexstamp'
  | 'inst'
  | 'institution'
  | 'isbn'
  | 'issn'
  | 'issue'
  | 'keyword'
  | 'keyword_facet'
  | 'keyword_norm'
  | 'keyword_schema'
  | 'lang'
  | 'links_data'
  | 'metadata_mtime'
  | 'metrics_mtime'
  | 'ned_object_facet_hier'
  | 'nedid'
  | 'nedtype'
  | 'nedtype_object_facet_hier'
  | 'nonbib_mtime'
  | 'orcid'
  | 'orcid_mtime'
  | 'orcid_other'
  | 'orcid_pub'
  | 'orcid_user'
  | 'page'
  | 'page_count'
  | 'property'
  | 'pub'
  | 'pub_raw'
  | 'pubdate'
  | 'publisher'
  | 'pubnote'
  | 'read_count'
  | 'reader'
  | 'recid'
  | 'reference'
  | 'series'
  | 'simbad_object_facet_hier'
  | 'simbid'
  | 'simbtype'
  | 'title'
  | 'update_timestamp'
  | 'vizier'
  | 'vizier_facet'
  | 'volume'
  | 'year';
