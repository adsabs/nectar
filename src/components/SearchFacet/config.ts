import { SearchFacetID } from './types';
import { ISearchFacetProps } from '@/components/SearchFacet/SearchFacet';
import { FacetField } from '@/api/search/types';

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
    forceUppercaseInitial: false,
    maxDepth: 1,
  },
  collections: {
    label: 'Collections',
    field: 'database' as FacetField,

    // collections should not have an exclude option (always additive)
    logic: {
      single: ['limit to'],
      multiple: ['and', 'or'],
    },
    storeId: 'collections',
  },
  refereed: {
    label: 'Refereed',
    field: 'property' as FacetField,
    facetQuery: 'property:refereed',
    logic: defaultLogic,
    filter: ['refereed', 'notrefereed'],
    storeId: 'refereed',
    noLoadMore: true,
  },
  institutions: {
    label: 'Institutions',
    field: 'aff_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'institutions',
    maxDepth: 1,
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
    maxDepth: 1,
  },
  ned: {
    label: 'NED Objects',
    field: 'ned_object_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'ned',
    maxDepth: 1,
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
    maxDepth: 1,
  },
  planetary: {
    label: 'Planetary Features',
    field: 'planetary_feature_facet_hier_3level' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'planetary',
    maxDepth: 2,
  },
  uat: {
    label: 'UAT',
    field: 'uat_facet_hier' as FacetField,
    hasChildren: true,
    logic: defaultLogic,
    storeId: 'uat',
    maxDepth: 2,
    noLoadMore: true,
  },
};
