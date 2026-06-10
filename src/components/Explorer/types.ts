import { FacetField } from '@/api/search/types';

export interface IExplorerCollection {
  id: ExplorerCollectionID;
  facetField: FacetField;
  searchQueryField: string;
  label: string;
  image?: string;
  facetSearchParams: { field: FacetField; level: 'root' | 'child' };
}

export type ExplorerCollectionID = (typeof validCollectionIds)[number];

const validCollectionIds = ['database', 'doctype', 'bibgroup', 'data'];

export function isExplorerCollection(value: string): value is ExplorerCollectionID {
  return validCollectionIds.includes(value as ExplorerCollectionID);
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
