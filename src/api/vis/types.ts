import { Bibcode } from '@api';
export interface IADSApiVisParams {
  bibcodes: Bibcode[];
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

export interface IADSApiAuthorNetworkNode {
  name: { nodeName: string; nodeWeight: number; delete: boolean }[] | string | number;
  children?: IADSApiAuthorNetworkNode[];
  numberName?: number;
  read_count?: number;
  citation_count?: number;
  papers?: string[];
  size?: number;
}

export type IADSApiPaperNodeKey = keyof IADSApiPaperNetworkSummaryGraphNode;
export type IADSApiAuthorNetworkNodeKey = keyof IADSApiAuthorNetworkNode;

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
