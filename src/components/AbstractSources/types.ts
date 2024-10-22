import { Esources, IDocsEntity } from '@/api/search/types';

export interface IGetOpenUrlOptions {
  metadata: IDocsEntity;
  linkServer: string;
}

export interface IFullTextSource {
  url: string;
  open?: boolean;
  shortName: string;
  name?: string;
  type?: string;
  description: string;
  openUrl?: boolean;
  rawType?: keyof typeof Esources;
}

export interface IDataProductSource {
  url: string;
  count: string;
  name: string;
  description: string;
}

export interface IRelatedWorks {
  url: string;
  name: string;
  description: string;
}

export type ProcessLinkDataReturns = {
  fullTextSources: IFullTextSource[];
  dataProducts: IDataProductSource[];
};
