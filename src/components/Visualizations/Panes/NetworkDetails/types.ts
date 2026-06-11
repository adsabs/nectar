import { IADSApiPaperNetworkSummaryGraphNode } from '@/api/vis/types';
import { IDocsEntity } from '@/api/search/types';

export interface Paper extends IDocsEntity {
  groupAuthorCount?: number;
}

export interface IAuthorNetworkNodeDetails {
  type: 'author' | 'group';
  name: string;
  papers: Paper[];
  mostRecentYear: string;
}

export interface IPaperNetworkNodeDetails extends IADSApiPaperNetworkSummaryGraphNode {
  papers: IDocsEntity[];
  titleWords: string[];
  topCommonReferences: {
    bibcode: string;
    percent: string;
    inGroup: boolean;
  }[];
}

export interface IPaperNetworkLinkDetails {
  groupOne: { name: string; color: string };
  groupTwo: { name: string; color: string };
  papers: { bibcode: string; percent1: number; percent2: number }[];
}
