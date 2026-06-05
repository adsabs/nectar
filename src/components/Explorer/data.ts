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
import { FacetField } from '@/api/search/types';
import { IExplorerFacet, IExplorerCollection } from './types';

export const collections: Record<IExplorerCollection['id'], IExplorerCollection> = {
  database: {
    id: 'database',
    facetField: 'database',
    label: 'Discipline',
  },
  doctype: {
    id: 'doctype',
    facetField: 'doctype_facet_hier',
    label: 'Record Type',
  },
  bibgroup: {
    id: 'bibgroup',
    facetField: 'bibgroup_facet',
    label: 'Curated Bibliography',
  },
  data: {
    id: 'data',
    facetField: 'data_facet',
    label: 'Curated Data Collection',
  },
};

export const collectionSearchParams: Record<IExplorerCollection['id'], { field: FacetField; level: 'root' | 'child' }> =
  {
    database: { field: 'database', level: 'root' },
    doctype: { field: 'doctype_facet_hier', level: 'child' },
    bibgroup: { field: 'bibgroup_facet', level: 'root' },
    data: { field: 'data_facet', level: 'root' },
  };

export const explorerFacets: Record<IExplorerCollection['id'], IExplorerFacet[]> = {
  database: [
    {
      id: 'astronomy',
      facetKey: 'astronomy',
      label: 'Astronomy',
      image: '/images/browse/discipline/astronomy.jpg',
      subDisciplines: [
        {
          id: 'astrophysics',
          facetKey: 'astrophysics',
          label: 'Astrophysics',
          image: '/images/browse/discipline/astrophysics.jpg',
        },
        {
          id: 'heliophysics',
          facetKey: 'heliophysics',
          label: 'Heliophysics',
          image: '/images/browse/discipline/heliophysics.jpg',
        },
        {
          id: 'planetary',
          facetKey: 'planetary',
          label: 'Planetary Science',
          image: '/images/browse/discipline/planetary-science.jpg',
        },
      ],
    },
    {
      id: 'physics',
      facetKey: 'physics',
      label: 'Physics',
      image: '/images/browse/discipline/physics.jpg',
      subDisciplines: [
        {
          id: 'astrophysics',
          facetKey: 'astrophysics',
          label: 'Astrophysics',
          image: '/images/browse/discipline/astrophysics.jpg',
        },
        {
          id: 'heliophysics',
          facetKey: 'heliophysics',
          label: 'Heliophysics',
          image: '/images/browse/discipline/heliophysics.jpg',
        },
      ],
    },
    {
      id: 'earthscience',
      facetKey: 'earthscience',
      label: 'Earth Science',
      image: '/images/browse/discipline/earth-science.jpg',
      subDisciplines: [],
    },
    {
      id: 'general',
      facetKey: 'general',
      label: 'General Science',
      image: '/images/browse/discipline/general-science.jpg',
      subDisciplines: [],
    },
  ],
  doctype: [
    { label: 'Open Access', icon: OpenAccessIcon, id: 'e-print', facetKey: '1/Article/e-print' },
    {
      label: 'Journal Articles',
      icon: JournalArticleIcon,
      id: 'Journal Article',
      facetKey: '1/Article/Journal Article',
    },
    { label: 'Datasets', icon: DatasetIcon, id: 'Dataset', facetKey: '1/Non-Article/Dataset' },
    { label: 'Software', icon: SoftwareIcon, id: 'Software', facetKey: '1/Non-Article/Software' },
  ],
  bibgroup: [
    { label: 'USGS', icon: USGSIcon, id: 'USGS', facetKey: 'USGS' },
    { label: 'JWST', icon: JWSTIcon, id: 'JWST', facetKey: 'JWST' },
    { label: 'NASA PubSpace', icon: NASAIcon, id: 'NASA PubSpace', facetKey: 'NASA PubSpace' },
    { label: 'SETI', icon: SETIIcon, id: 'SETI', facetKey: 'SETI' },
  ],
  data: [
    { label: 'MAST', icon: MASTIcon, id: 'MAST', facetKey: 'MAST' },
    { label: 'HEASARC', icon: HEASARCIcon, id: 'HEASARC', facetKey: 'HEASARC' },
    { label: 'NOAA', icon: NOAAIcon, id: 'NOAA', facetKey: 'NOAA' },
    { label: 'GitHub', icon: GithubIcon, id: 'GITHUB', facetKey: 'GITHUB' },
  ],
};
