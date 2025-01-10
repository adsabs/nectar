import { FacetField } from '@/api/search/types';

export interface IFacetNode {
  key: string;
  selected: boolean;
  partSelected: boolean;
  expanded: boolean;
  children?: FacetChildNodeTree;
}

export type FacetNodeTree = Record<string, IFacetNode>;
export type FacetChildNode = Omit<IFacetNode, 'children' | 'expanded' | 'partSelected'>;
export type FacetChildNodeTree = Record<string, FacetChildNode>;

/**
 * Facet params
 * these map roughly to the dynamic params in IADSApiSearchParams
 */
export interface IFacetParams {
  field: FacetField;
  limit?: number;
  offset?: number;
  prefix?: string;
  query?: string;
  filter?: string[];
  logic?: FacetLogic;
  sort?: 'count' | 'index';
  sortDir?: 'asc' | 'desc';
}

export type FacetLogic = 'limit to' | 'exclude' | 'or' | 'and';

export const facetFields: FacetField[] = [
  'author_facet',
  'bibgroup_facet',
  'bibstem_facet',
  'data_facet',
  'keyword_facet',
  'vizier_facet',
  'property',
  'database',
  'aff_facet_hier',
  'author_facet_hier',
  'doctype_facet_hier',
  'first_author_facet_hier',
  'first_author_facet_hier',
  'grant_facet_hier',
  'ned_object_facet_hier',
  'nedtype_object_facet_hier',
  'simbad_object_facet_hier',
  'planetary_feature_facet_hier_3level',
  'uat_facet_hier',
];

export type SearchFacetID =
  | 'author'
  | 'collections'
  | 'refereed'
  | 'institutions'
  | 'keywords'
  | 'publications'
  | 'bibgroups'
  | 'simbad'
  | 'ned'
  | 'data'
  | 'vizier'
  | 'pubtype'
  | 'planetary'
  | 'uat';

export type FacetCountTuple = [string, number];

export type FacetItem = { id: string; val: string; count: number; parentId: string; level?: number };

export type OnFilterArgs = {
  logic: FacetLogic;
  field: FacetField;
  values: string[];
};

export type KeyboardFocusItem = { facetId: SearchFacetID; index: number[] };
