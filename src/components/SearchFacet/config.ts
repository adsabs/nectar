import { ISearchFacetProps } from './SearchFacet';

const defaultLogic: ISearchFacetProps['logic'] = {
  single: ['limit to', 'exclude'],
  multiple: ['and', 'or', 'exclude'],
};

export const facetConfig: Omit<ISearchFacetProps, 'onQueryUpdate'>[] = [
  { label: 'Author', field: 'author_facet_hier', hasChildren: true, logic: defaultLogic, defaultIsOpen: true },
  { label: 'Collections', field: 'database', logic: defaultLogic, defaultIsOpen: true },
  {
    label: 'Refereed',
    field: 'property',
    facetQuery: 'property:refereed',
    logic: defaultLogic,
    defaultIsOpen: true,
    filter: ['refereed', 'notrefereed'],
  },
  { label: 'Institutions', field: 'aff_facet_hier', hasChildren: true, logic: defaultLogic },
  { label: 'Keywords', field: 'keyword_facet', logic: defaultLogic },
  { label: 'Publications', field: 'bibstem_facet', logic: defaultLogic },
  { label: 'Bibgroups', field: 'bibgroup_facet', logic: defaultLogic },
  { label: 'SIMBAD Objects', field: 'simbad_object_facet_hier', hasChildren: true, logic: defaultLogic },
  { label: 'NED Objects', field: 'ned_object_facet_hier', hasChildren: true, logic: defaultLogic },
  { label: 'Data', field: 'data_facet', logic: defaultLogic },
  { label: 'Vizier Tables', field: 'vizier_facet', logic: defaultLogic },
  { label: 'Publication Type', field: 'doctype_facet_hier', hasChildren: true, logic: defaultLogic },
];
