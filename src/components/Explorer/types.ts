import { FacetField } from '@/api/search/types';

export interface IExplorerCollection {
  id: ExplorerCollectionID;
  facetField: FacetField;
  searchQueryField: string;
  label: string;
  image?: string;
  facetSearchParams: { field: FacetField; level: 'root' | 'child' };
  ignoreFacetKeys?: IExplorerFacet['facetKey'][];
  filterFacetKeys?: IExplorerFacet['facetKey'][]; // only select these keys, should not be used with ignoreFacetKeys
}

export type ExplorerCollectionID = (typeof EXPLORER_COLLECTION_IDS)[number];

export const EXPLORER_COLLECTION_IDS = ['database', 'doctype', 'bibgroup', 'data'] as const;

export function isExplorerCollection(value: unknown): value is ExplorerCollectionID {
  return typeof value === 'string' && (EXPLORER_COLLECTION_IDS as readonly string[]).includes(value);
}

export interface IExplorerFacet {
  id: string; // used locally
  facetKey: string; // the facet key used in search response, e.g '1/Article/Journal Article', "MAST"
  searchQueryValue: string;
  label: string;
  icon?: React.FC;
  image?: string;
  subset?: IExplorerFacet['id'][];
}

export interface IFacetDetail {
  facetKey: string;
  title: string;
  icon?: React.FC;
  desc?: string;
}
