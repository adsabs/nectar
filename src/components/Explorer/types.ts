import { FacetField } from '@/api/search/types';

export interface IExplorerCollection {
  id: 'database' | 'doctype' | 'bibgroup' | 'data';
  facetField: FacetField;
  label: string;
}

export interface IExplorerFacet {
  id: string; // used locally
  facetKey: string; // the facet key used in search response, e.g '1/Article/Journal Article', "MAST"
  label: string;
  icon?: React.FC;
  image?: string;
  subDisciplines?: IExplorerFacet[];
}
