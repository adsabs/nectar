import { Bibcode } from '@api';
export interface IADSApiVisParams {
  bibcodes: Bibcode[];
}

export interface IADSApiVisResponse {
  data: { bibcode_dict: IBibcodeDict; link_data: number[][]; root: IADSApiVisNode };
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

export interface IADSApiVisNode {
  name: { nodeName: string; nodeWeight: number; delete: boolean }[] | string | number;
  children?: IADSApiVisNode[];
  numberName?: number;
  read_count?: number;
  citation_count?: number;
  papers?: string[];
  size?: number;
}

export type IADSApiVisNodeKey = keyof IADSApiVisNode;
