import { FacetField } from '@api';
import { ISearchFacetProps } from './SearchFacet';
import { SearchFacetID } from './types';

const defaultLogic: ISearchFacetProps['logic'] = {
  single: ['limit to', 'exclude'],
  multiple: ['and', 'or', 'exclude'],
};

export const facetConfig: Record<SearchFacetID, Omit<ISearchFacetProps, 'onQueryUpdate'>> = {
  author: {
    label: 'Author',
    field: 'author_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'author',
  },
  collections: {
    label: 'Collections',
    field: 'database' as FacetField,
    logic: defaultLogic,
    storeId: 'collections',
  },
  refereed: {
    label: 'Refereed',
    field: 'property' as FacetField,
    facetQuery: 'property:refereed',
    logic: defaultLogic,
    filter: ['refereed', 'notrefereed'],
    storeId: 'refereed',
  },
  institutions: {
    label: 'Institutions',
    field: 'aff_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'institutions',
  },
  keywords: {
    label: 'Keywords',
    field: 'keyword_facet' as FacetField,
    logic: defaultLogic,
    storeId: 'keywords',
  },
  publications: {
    label: 'Publications',
    field: 'bibstem_facet' as FacetField,
    logic: defaultLogic,
    storeId: 'publications',
  },
  bibgroups: {
    label: 'Bibgroups',
    field: 'bibgroup_facet' as FacetField,
    logic: defaultLogic,
    storeId: 'bibgroups',
  },
  simbad: {
    label: 'SIMBAD Objects',
    field: 'simbad_object_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'simbad',
  },
  ned: {
    label: 'NED Objects',
    field: 'ned_object_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'ned',
  },
  data: {
    label: 'Data',
    field: 'data_facet' as FacetField,
    logic: defaultLogic,
    storeId: 'data',
  },
  vizier: {
    label: 'Vizier Tables',
    field: 'vizier_facet' as FacetField,
    logic: defaultLogic,
    storeId: 'vizier',
  },
  pubtype: {
    label: 'Publication Type',
    field: 'doctype_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'pubtype',
  },
};
