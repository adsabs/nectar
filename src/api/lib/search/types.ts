import { SolrField, SolrSort } from '../models';

export interface IADSApiSearchParams {
  q: string;
  fl?: SolrField[];
  rows?: number;
  start?: number;
  sort?: SolrSort[];
  hl?: boolean;
  'hl.fl'?: string;
  'hl.maxAnalyzedChars'?: number;
  'hl.requireFieldMatch'?: boolean;
  'hl.usePhraseHighlighter'?: boolean;
  fq?: string;
  stats?: string;
  'stats.field'?: string;
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
  stats?: ISearchStatsFields;
}

export interface ISearchStatsFields {
  stats_fields: {
    citation_count?: ISearchStats;
    citation_count_norm?: ISearchStats;
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
  abstract?: string;
  ack?: string;
  aff?: string[];
  aff_id?: string;
  alternate_bibcode?: string;
  alternate_title?: string;
  arxiv_class?: string;
  author?: string[];
  author_count?: number;
  author_facet?: string;
  author_facet_hier?: string;
  author_norm?: string;
  bibcode?: string;
  bibgroup?: string;
  bibgroup_facet?: string;
  bibstem?: string[];
  bibstem_facet?: string;
  body?: string;
  citation?: string;
  '[citations]'?: {
    num_citations?: number;
    num_references?: number;
  };
  citation_count?: string;
  citation_count_norm?: string;
  cite_read_boost?: string;
  classic_factor?: string;
  comment?: string[];
  copyright?: string;
  data?: string[];
  data_facet?: string;
  database?: string;
  date?: string;
  doctype?: string;
  doctype_facet_hier?: string;
  doi?: string;
  eid?: string;
  email?: string;
  entdate?: string;
  entry_date?: string;
  esources?: Esources[];
  facility?: string;
  first_author?: string;
  first_author_facet_hier?: string;
  first_author_norm?: string;
  grant?: string;
  grant_agencies?: string;
  grant_facet_hier?: string;
  grant_id?: string;
  id?: string;
  identifier?: string[];
  ids_data?: string;
  indexstamp?: string;
  inst?: string;
  isbn?: string;
  issn?: string;
  issue?: string;
  keyword?: string[];
  keyword_facet?: string;
  keyword_norm?: string;
  keyword_schema?: string;
  lang?: string;
  links_data?: string[];
  nedid?: string;
  nedtype?: string;
  nedtype_object_facet_hier?: string;
  orcid_other?: string;
  orcid_pub?: string;
  orcid_user?: string;
  page?: string;
  page_count?: string;
  page_range?: string;
  property?: string[];
  pub?: string;
  pub_raw?: string;
  pubdate?: string;
  pubnote?: string;
  read_count?: string;
  reader?: string;
  recid?: string;
  reference?: string;
  references_count?: number;
  simbad_object_facet_hier?: string;
  simbid?: string;
  simbtype?: string;
  thesis?: string;
  title?: string[];
  vizier?: string;
  vizier_facet?: string;
  volume?: string;
  year?: string;
  abs?: string;
  all?: string;
  arxiv?: string;
}

export interface IDocument {
  error?: string;
  notFound?: boolean;
  doc?: IDocsEntity;
}

export interface IADSApiSearchErrorResponse {
  error: string;
}
