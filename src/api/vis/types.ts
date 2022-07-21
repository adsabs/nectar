import { Bibcode } from '@api';
import { SunburstNode } from '@components/Visualizations/types';

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

// Extend graph nodes so we can directly use these as graph data
// export interface IADSApiVisNode extends SunburstNode {
//   name: { nodeName: string; nodeWeight: number; delete: boolean }[];
//   children: IGroup[];
// }

// export interface IGroup extends SunburstNode {
//   name: string;
//   children: ILeaf[];
// }

// export interface ILeaf extends SunburstNode {
//   name: string;
//   numberName: number;
//   read_count: number;
//   citation_count: number;
//   papers: string[];
//   size: number;
// }

export interface IADSApiVisNode {
  name: { nodeName: string; nodeWeight: number; delete: boolean }[] | string;
  children?: IADSApiVisNode[];
  numberName?: number;
  read_count?: number;
  citation_count?: number;
  papers?: string[];
  size?: number;
}
