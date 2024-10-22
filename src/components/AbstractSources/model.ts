import { Esources } from '@/api/search/types';

export const GATEWAY_BASE_URL = '/link_gateway/';

export const DEFAULT_ORDERING = [
  Esources.ADS_PDF,
  Esources.ADS_SCAN,
  Esources.INSTITUTION,
  Esources.PUB_PDF,
  Esources.PUB_HTML,
  Esources.EPRINT_PDF,
  Esources.EPRINT_HTML,
  Esources.AUTHOR_PDF,
  Esources.AUTHOR_HTML,
];

export interface ILinkType {
  name?: string;
  shortName: string;
  description: string;
  type?: string;
}

export const MAYBE_OPEN_SOURCES = [
  Esources.ADS_PDF,
  Esources.ADS_SCAN,
  Esources.AUTHOR_PDF,
  Esources.AUTHOR_HTML,
  Esources.EPRINT_PDF,
  Esources.EPRINT_HTML,
  Esources.PUB_PDF,
  Esources.PUB_HTML,
];

// set of link types and descriptions
export const LINK_TYPES: Record<keyof typeof Esources, ILinkType> = {
  INSTITUTION: {
    type: 'INSTITUTION',
    shortName: 'My Institution',
    name: 'My Institution',
    description: 'Find Article At My Institution',
  },
  AcA: {
    shortName: 'AcA',
    description: 'Acta Astronomica Data Files',
  },
  ADS_PDF: {
    name: 'ADS PDF',
    shortName: 'ADS',
    description: 'ADS PDF',
    type: 'PDF',
  },
  ADS_SCAN: {
    name: 'ADS Scanned Article',
    description: 'ADS scanned article',
    shortName: 'ADS',
    type: 'SCAN',
  },
  ALMA: {
    shortName: 'ALMA',
    description: 'Atacama Large Millimeter/submillimeter Array',
  },
  ARI: {
    shortName: 'ARI',
    description: 'Astronomisches Rechen-Institut',
  },
  Astroverse: {
    shortName: 'Astroverse',
    description: 'CfA Dataverse',
  },
  ATNF: {
    shortName: 'ATNF',
    description: 'Australia Telescope Online Archive',
  },
  Author: {
    shortName: 'Author',
    description: 'Author Hosted Dataset',
  },
  AUTHOR_HTML: {
    name: 'Author Article',
    shortName: 'Author',
    description: 'Link to HTML page provided by author',
    type: 'HTML',
  },
  AUTHOR_PDF: {
    name: 'Author PDF',
    shortName: 'Author',
    description: 'Link to PDF page provided by author',
    type: 'PDF',
  },
  BAVJ: {
    shortName: 'BAVJ',
    description: 'Data of the German Association for Variable Stars',
  },
  BICEP2: {
    shortName: 'BICEP2',
    description: 'BICEP/Keck Data',
  },
  CADC: {
    shortName: 'CADC',
    description: 'Canadian Astronomy Data Center',
  },
  CDS: {
    shortName: 'CDS',
    description: 'Strasbourg Astronomical Data Center',
  },
  Chandra: {
    shortName: 'Chandra',
    description: 'Chandra X-Ray Observatory',
  },
  Dataverse: {
    shortName: 'Dataverse',
    description: 'Dataverse Project',
  },
  Dryad: {
    shortName: 'Dryad',
    description: 'International Repository of Research Data',
  },
  EPRINT_HTML: {
    name: 'Preprint Article',
    shortName: 'Preprint',
    description: 'Preprint article',
    type: 'HTML',
  },
  EPRINT_PDF: {
    name: 'Preprint PDF',
    shortName: 'Preprint',
    description: 'Preprint PDF',
    type: 'PDF',
  },
  ESA: {
    shortName: 'ESA',
    description: 'ESAC Science Data Center',
  },
  ESO: {
    shortName: 'ESO',
    description: 'European Southern Observatory',
  },
  Figshare: {
    shortName: 'Figshare',
    description: 'Online Open Access Repository',
  },
  GCPD: {
    shortName: 'GCPD',
    description: 'The General Catalogue of Photometric Data',
  },
  Github: {
    shortName: 'Github',
    description: 'Web-based version-control and collaboration platform for software developers.',
  },
  GTC: {
    shortName: 'GTC',
    description: 'Gran Telescopio CANARIAS Public Archive',
  },
  HEASARC: {
    shortName: 'HEASARC',
    description: "NASA's High Energy Astrophysics Science Archive Research Center",
  },
  Herschel: {
    shortName: 'Herschel',
    description: 'Herschel Science Center',
  },
  IBVS: {
    shortName: 'IBVS',
    description: 'Information Bulletin on Variable Stars',
  },
  INES: {
    shortName: 'INES',
    description: 'IUE Newly Extracted Spectra',
  },
  IRSA: {
    shortName: 'IRSA',
    description: 'NASA/IPAC Infrared Science Archive',
  },
  ISO: {
    shortName: 'ISO',
    description: 'Infrared Space Observatory',
  },
  JWST: {
    shortName: 'JWST',
    description: 'JWST Proposal Info',
  },
  KOA: {
    shortName: 'KOA',
    description: 'Keck Observatory Archive',
  },
  MAST: {
    shortName: 'MAST',
    description: 'Mikulski Archive for Space Telescopes',
  },
  NED: {
    shortName: 'NED',
    description: 'NASA/IPAC Extragalactic Database',
  },
  NExScI: {
    shortName: 'NExScI',
    description: 'NASA Exoplanet Archive',
  },
  NOAO: {
    shortName: 'NOAO',
    description: 'National Optical Astronomy Observatory',
  },
  PANGAEA: {
    shortName: 'PANGAEA',
    description: 'Digital Data Library and a Data Publisher for Earth System Science',
  },
  PASA: {
    shortName: 'PASA',
    description: 'Publication of the Astronomical Society of Australia Datasets',
  },
  PDG: {
    shortName: 'PDG',
    description: 'Particle Data Group',
  },
  PDS: {
    shortName: 'PDS',
    description: 'The NASA Planetary Data System',
  },
  protocols: {
    shortName: 'protocols',
    description: 'Collaborative Platform and Preprint Server for Science Methods and Protocols',
  },
  PUB_HTML: {
    name: 'Publisher Article',
    shortName: 'Publisher',
    description: 'Electronic on-line publisher article (HTML)',
    type: 'HTML',
  },
  PUB_PDF: {
    name: 'Publisher PDF',
    shortName: 'Publisher',
    description: 'Publisher PDF',
    type: 'PDF',
  },
  SIMBAD: {
    shortName: 'SIMBAD',
    description: 'SIMBAD Database at the CDS',
  },
  Spitzer: {
    shortName: 'Spitzer',
    description: 'Spitzer Space Telescope',
  },
  TNS: {
    shortName: 'TNS',
    description: 'Transient Name Server',
  },
  Vizier: {
    shortName: 'VizieR',
    description: 'VizieR Catalog Service',
  },
  XMM: {
    shortName: 'XMM',
    description: 'XMM Newton Science Archive',
  },
  Zenodo: {
    shortName: 'Zenodo',
    description: 'Zenodo Archive',
  },
};
