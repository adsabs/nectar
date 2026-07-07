import { DatasetIcon } from '@/components/icons/browser/DatasetIcon';
import { JournalArticleIcon } from '@/components/icons/browser/JournalArticleIcon';
import { OpenAccessIcon } from '@/components/icons/browser/OpenAccessIcon';
import { SoftwareIcon } from '@/components/icons/browser/SoftwareIcon';
import { USGSIcon } from '@/components/icons/browser/USGSIcon';
import { JWSTIcon } from '@/components/icons/browser/JWSTIcon';
import { NASAIcon } from '@/components/icons/browser/NASAIcon';
import { SETIIcon } from '@/components/icons/browser/SETIIcon';
import { MASTIcon } from '@/components/icons/browser/MASTIcon';
import { HEASARCIcon } from '@/components/icons/browser/HEASARCIcon';
import { GithubIcon } from '@/components/icons/browser/GithubIcon';
import { NOAAIcon } from '@/components/icons/browser/NOAAIcon';
import { IExplorerFacet, IExplorerCollection } from './types';

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
    label: 'Curated Data Collection',
    searchQueryField: 'data',
    image: '/images/browse/datacollection.jpg',
    facetSearchParams: { field: 'data_facet', level: 'root' },
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
      label: 'Open Access',
      icon: OpenAccessIcon,
      id: 'e-print',
      facetKey: '1/Article/e-print',
      searchQueryValue: 'e-print',
    },
    {
      label: 'Journal Articles',
      icon: JournalArticleIcon,
      id: 'Journal Article',
      facetKey: '1/Article/Journal Article',
      searchQueryValue: 'Journal Article',
    },
    {
      label: 'Dataset',
      icon: DatasetIcon,
      id: 'Dataset',
      facetKey: '1/Non-Article/Dataset',
      searchQueryValue: 'Dataset',
    },
    {
      label: 'Software',
      icon: SoftwareIcon,
      id: 'Software',
      facetKey: '1/Non-Article/Software',
      searchQueryValue: 'Software',
    },
  ],
  bibgroup: [
    { label: 'USGS', icon: USGSIcon, id: 'USGS', facetKey: 'USGS', searchQueryValue: 'USGS' },
    { label: 'JWST', icon: JWSTIcon, id: 'JWST', facetKey: 'JWST', searchQueryValue: 'JWST' },
    {
      label: 'NASA PubSpace',
      icon: NASAIcon,
      id: 'NASA PubSpace',
      facetKey: 'NASA PubSpace',
      searchQueryValue: 'NASA PubSpace',
    },
    { label: 'SETI', icon: SETIIcon, id: 'SETI', facetKey: 'SETI', searchQueryValue: 'SETI' },
  ],
  data: [
    { label: 'MAST', icon: MASTIcon, id: 'MAST', facetKey: 'MAST', searchQueryValue: 'MAST' },
    { label: 'HEASARC', icon: HEASARCIcon, id: 'HEASARC', facetKey: 'HEASARC', searchQueryValue: 'HEASARC' },
    { label: 'NOAA', icon: NOAAIcon, id: 'NOAA', facetKey: 'NOAA', searchQueryValue: 'NOAA' },
    { label: 'GitHub', icon: GithubIcon, id: 'GITHUB', facetKey: 'GITHUB', searchQueryValue: 'GITHUB' },
  ],
};

export const doctypeMap: Record<string, string[]> = {
  '1/Article/Journal Article': ['article'],
  '1/Article/Proceedings Article': ['inproceedings'],
  '1/Article/e-print': ['eprint'],
  '1/Article/Book Chapter': ['inbook'],
  '1/Non-Article/Abstract': ['abstract'],
  '1/Non-Article/Proposal': ['proposal'],
  '1/Non-Article/Tech Report': ['techreport'],
  '1/Non-Article/PhD Thesis': ['phdthesis'],
  '1/Non-Article/Other': ['misc', 'obituary', 'erratum', 'bookreview'],
  '1/Non-Article/Circular': ['circular'],
  '1/Non-Article/Proceedings': ['proceedings'],
  '1/Non-Article/Dataset': ['dataset'],
  '1/Non-Article/Book': ['book'],
  '1/Non-Article/Editorial': ['editorial'],
  '1/Non-Article/Software': ['software'],
  '1/Non-Article/Newsletter': ['newsletter'],
  '1/Non-Article/Masters Thesis': ['mastersthesis'],
  '1/Non-Article/Press Release': ['pressrelease'],
  '1/Non-Article/Catalog': ['catalog'],
  '1/Non-Article/Talk': ['talk'],
  '1/Non-Article/Service': ['service'],
  '1/Non-Article/Instrument': ['instrument'],
};
