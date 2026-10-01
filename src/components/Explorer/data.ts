import { IExplorerFacet, IExplorerCollection } from './types';
import { DatasetIcon, EPrintIcon, JournalArticleIcon, SoftwareIcon } from '../icons/browser/doctype';
import { AstroDataIcon, ClimateIcon } from '../icons/browser/data';
import { JwstIcon, NasaIcon, SetiIcon, UsgsIcon } from '../icons/browser/bibgroup';
import { dataDetails } from './data_data';

export const explorerCollections: Record<IExplorerCollection['id'], IExplorerCollection> = {
  database: {
    id: 'database',
    facetField: 'database',
    label: 'Discipline',
    searchQueryField: 'database',
    facetSearchParams: { field: 'database', level: 'root' },
  },
  doctype: {
    id: 'doctype',
    facetField: 'doctype_facet_hier',
    label: 'Record Type',
    searchQueryField: 'doctype',
    image: '/images/browse/doctype.jpg',
    facetSearchParams: { field: 'doctype_facet_hier', level: 'child' },
    ignoreFacetKeys: ['0/Article', '0/Non-Article'],
  },
  bibgroup: {
    id: 'bibgroup',
    facetField: 'bibgroup_facet',
    label: 'Curated Bibliography',
    searchQueryField: 'bibgroup',
    image: '/images/browse/bibgroup.jpg',
    facetSearchParams: { field: 'bibgroup_facet', level: 'root' },
  },
  data: {
    id: 'data',
    facetField: 'data_facet',
    label: 'Records linked to scientific archives',
    searchQueryField: 'data',
    image: '/images/browse/datacollection.jpg',
    facetSearchParams: { field: 'data_facet', level: 'root' },
    filterFacetKeys: Object.keys(dataDetails),
  },
};

export const databases: Record<IExplorerCollection['id'], IExplorerFacet> = {
  astronomy: {
    id: 'astronomy',
    facetKey: 'astronomy',
    searchQueryValue: 'astronomy',
    label: 'Astronomy',
    image: '/images/browse/discipline/astronomy.jpg',
    subset: ['astrophysics', 'heliophysics', 'planetary'],
  },
  physics: {
    id: 'physics',
    facetKey: 'physics',
    searchQueryValue: 'physics',
    label: 'Physics',
    image: '/images/browse/discipline/physics.jpg',
    subset: [],
  },
  earthscience: {
    id: 'earthscience',
    facetKey: 'earthscience',
    searchQueryValue: 'earthscience',
    label: 'Earth Science',
    image: '/images/browse/discipline/earth-science.jpg',
    subset: [],
  },
  general: {
    id: 'general',
    facetKey: 'general',
    searchQueryValue: 'general',
    label: 'General Science',
    image: '/images/browse/discipline/general-science.jpg',
    subset: [],
  },
  astrophysics: {
    id: 'astrophysics',
    facetKey: 'astrophysics',
    searchQueryValue: 'astrophysics',
    label: 'Astrophysics',
    image: '/images/browse/discipline/astrophysics.jpg',
    subset: [],
  },
  heliophysics: {
    id: 'heliophysics',
    facetKey: 'heliophysics',
    searchQueryValue: 'heliophysics',
    label: 'Heliophysics',
    image: '/images/browse/discipline/heliophysics.jpg',
    subset: [],
  },
  planetary: {
    id: 'planetary',
    facetKey: 'planetary',
    searchQueryValue: 'planetary',
    label: 'Planetary Science',
    image: '/images/browse/discipline/planetary-science.jpg',
    subset: [],
  },
};

export const explorerFacets: Record<IExplorerCollection['id'], IExplorerFacet[]> = {
  database: [databases.astronomy, databases.physics, databases.earthscience, databases.general],

  doctype: [
    {
      label: 'e-print',
      icon: EPrintIcon,
      id: 'e-print',
      facetKey: '1/Article/e-print',
      searchQueryValue: 'eprint',
    },
    {
      label: 'Journal Articles',
      icon: JournalArticleIcon,
      id: 'Journal Article',
      facetKey: '1/Article/Journal Article',
      searchQueryValue: 'article',
    },
    {
      label: 'Datasets',
      icon: DatasetIcon,
      id: 'Dataset',
      facetKey: '1/Non-Article/Dataset',
      searchQueryValue: 'dataset',
    },
    {
      label: 'Software',
      icon: SoftwareIcon,
      id: 'Software',
      facetKey: '1/Non-Article/Software',
      searchQueryValue: 'software',
    },
  ],
  bibgroup: [
    { label: 'USGS', icon: UsgsIcon, id: 'USGS', facetKey: 'USGS', searchQueryValue: 'USGS' },
    { label: 'JWST', icon: JwstIcon, id: 'JWST', facetKey: 'JWST', searchQueryValue: 'JWST' },
    {
      label: 'NASA PubSpace',
      icon: NasaIcon,
      id: 'NASA PubSpace',
      facetKey: 'NASA PubSpace',
      searchQueryValue: 'NASA PubSpace',
    },
    { label: 'SETI', icon: SetiIcon, id: 'SETI', facetKey: 'SETI', searchQueryValue: 'SETI' },
  ],
  data: [
    { label: 'SIMBAD', icon: AstroDataIcon, id: 'SIMBAD', facetKey: 'SIMBAD', searchQueryValue: 'SIMBAD' },
    { label: 'MAST', icon: AstroDataIcon, id: 'MAST', facetKey: 'MAST', searchQueryValue: 'MAST' },
    { label: 'HEASARC', icon: AstroDataIcon, id: 'HEASARC', facetKey: 'HEASARC', searchQueryValue: 'HEASARC' },
    { label: 'NOAA', icon: ClimateIcon, id: 'NOAA', facetKey: 'NOAA', searchQueryValue: 'NOAA' },
  ],
};
