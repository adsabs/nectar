import { Bibcode, IADSApiSearchParams } from '@/api/search/types';

export interface IADSApiVisParams {
  bibcodes?: Bibcode[];
  query?: string[];
}

type ParamValueType = IADSApiSearchParams[keyof IADSApiSearchParams];

export interface IADSApiWordCloudParams {
  [key: string]: ParamValueType[];
}

export interface IADSApiAuthorNetworkResponse {
  data: { bibcode_dict: IBibcodeDict; link_data: number[][]; root: IADSApiAuthorNetworkNode };
  msg: { numFound: number; start: number; rows: number };
}

export interface IBibcodeDict {
  [bibcode: string]: IBibcodeData;
}

export interface IBibcodeData {
  authors: string[];
  citation_count: number;
  read_count: number;
  title: string | string[];
}

export interface IRootName {
  nodeName: string;
  nodeWeight: number;
  delete: boolean;
}

export interface IADSApiAuthorNetworkNode {
  name: IRootName[] | string | number;
  children?: IADSApiAuthorNetworkNode[];
  numberName?: number;
  read_count?: number;
  citation_count?: number;
  papers?: string[];
  size?: number;
}

export type IADSApiPaperNetworkNodeKey = 'paper_count' | 'total_citations' | 'total_reads';
export type IADSApiAuthorNetworkNodeKey = 'size' | 'citation_count' | 'read_count';

export interface IADSApiPaperNetworkResponse {
  data: { summaryGraph: IADSApiPaperNetworkSummaryGraph; fullGraph: IADSApiPaperNetworkFullGraph };
  msg: { numFound: number; start: number; rows: number };
}

export interface IADSApiPaperNetworkSummaryGraph {
  directed: boolean;
  graph: number[];
  nodes: IADSApiPaperNetworkSummaryGraphNode[];
  links: {
    source: number;
    target: number;
    weight: number;
  }[];
  multigraph: boolean;
}

export interface IADSApiPaperNetworkSummaryGraphNode {
  paper_count: number;
  node_label: {
    [label in string]: number;
  };
  total_citations: number;
  node_name: number;
  top_common_references: {
    [bibcode in string]: number;
  };
  total_reads: number;
  stable_index: number;
  id: number;
}

export interface IADSApiPaperNetworkFullGraph {
  directed: boolean;
  graph: number[];
  nodes: IADSApiPaperNetworkFullGraphNode[];
  links: {
    overlap: string[];
    source: number;
    target: number;
    weight: number;
  }[];
  multigraph: boolean;
}

export interface IADSApiPaperNetworkFullGraphNode {
  read_count: number;
  group: number;
  title: string;
  first_author: string;
  citation_count: number;
  node_name: string;
  id: number;
  nodeWeight: number;
}

export interface IADSApiWordCloudResponse {
  [word: string]: {
    idf: number;
    record_count: number;
    total_occurrences: number;
  };
}
