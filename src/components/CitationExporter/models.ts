import { SelectOption } from '@/components/Select';
import { ExportApiFormatKey } from '@/api/export/types';
import { pick } from 'ramda';

export type ExportFormat = SelectOption<ExportApiFormatKey> & { ext: string };

export const exportFormats: Record<ExportApiFormatKey, ExportFormat> = {
  aastex: {
    id: ExportApiFormatKey.aastex,
    label: 'AASTeX',
    help: 'LaTeX format for AAS journals',
    ext: 'txt',
    value: 'aastex',
  },
  ads: {
    id: ExportApiFormatKey.ads,
    label: 'ADS',
    help: 'ADS format',
    ext: 'txt',
    value: 'ads',
  },
  agu: {
    id: ExportApiFormatKey.agu,
    label: 'AGU',
    help: 'American Geophysical Union format',
    ext: 'rtf',
    value: 'agu',
  },
  ams: {
    id: ExportApiFormatKey.ams,
    label: 'AMS',
    help: 'American Meteorological Society format',
    ext: 'rtf',
    value: 'ams',
  },
  bibtex: {
    id: ExportApiFormatKey.bibtex,
    label: 'BibTeX',
    help: 'BibTeX format',
    ext: 'bib',
    value: 'bibtex',
  },
  bibtexabs: {
    id: ExportApiFormatKey.bibtexabs,
    label: 'BibTeX ABS',
    help: 'BibTeX with abstracts',
    ext: 'bib',
    value: 'bibtexabs',
  },
  custom: {
    id: ExportApiFormatKey.custom,
    label: 'Custom Format',
    help: 'Enter Your Own Custom Format',
    ext: 'txt',
    value: 'custom',
  },
  dcxml: {
    id: ExportApiFormatKey.dcxml,
    label: 'DC-XML',
    help: 'Dublin Core XML format',
    ext: 'xml',
    value: 'dcxml',
  },
  endnote: {
    id: ExportApiFormatKey.endnote,
    label: 'EndNote',
    help: 'EndNote format',
    ext: 'enw',
    value: 'endnote',
  },
  gsa: {
    id: ExportApiFormatKey.gsa,
    label: 'GSA',
    help: 'The Geological Society of America format',
    ext: 'rtf',
    value: 'GSA',
  },
  icarus: {
    id: ExportApiFormatKey.icarus,
    label: 'Icarus',
    help: 'LaTeX format for use in Icarus',
    ext: 'txt',
    value: 'icarus',
  },
  ieee: {
    id: ExportApiFormatKey.ieee,
    label: 'IEEE',
    help: 'IEEE format',
    ext: 'txt',
    value: 'ieee',
  },
  jatsxml: {
    id: ExportApiFormatKey.jatsxml,
    label: 'JATS-XML',
    help: 'Journal Article Tag Suite (JATS) XML format',
    ext: 'xml',
    value: 'jatsxml',
  },
  medlars: {
    id: ExportApiFormatKey.medlars,
    label: 'MEDLARS',
    help: 'Medical Literature Analysis and Retrieval System (MEDLARS) format',
    ext: 'txt',
    value: 'medlars',
  },
  mnras: {
    id: ExportApiFormatKey.mnras,
    label: 'MNRAS',
    help: 'LaTeX format for use in MNRAS',
    ext: 'txt',
    value: 'mnras',
  },
  procite: {
    id: ExportApiFormatKey.procite,
    label: 'ProCite',
    help: 'ProCite format',
    ext: 'txt',
    value: 'procite',
  },
  refabsxml: {
    id: ExportApiFormatKey.refabsxml,
    label: 'REFABS-XML',
    help: 'ADS records in XML format',
    ext: 'xml',
    value: 'refabsxml',
  },
  refworks: {
    id: ExportApiFormatKey.refworks,
    label: 'RefWorks',
    help: 'RefWorks format',
    ext: 'txt',
    value: 'refworks',
  },
  refxml: {
    id: ExportApiFormatKey.refxml,
    label: 'REF-XML',
    help: 'ADS link data in XML format',
    ext: 'xml',
    value: 'refxml',
  },
  ris: {
    id: ExportApiFormatKey.ris,
    label: 'RIS',
    help: 'Research Information Systems (RIS) format',
    ext: 'txt',
    value: 'ris',
  },
  rss: {
    id: ExportApiFormatKey.rss,
    label: 'RSS',
    help: 'RSS format',
    ext: 'rss',
    value: 'rss',
  },
  soph: {
    id: ExportApiFormatKey.soph,
    label: 'Solar Physics',
    help: 'LaTeX format for use in Solar Physics',
    ext: 'txt',
    value: 'soph',
  },
  votable: {
    id: ExportApiFormatKey.votable,
    label: 'VOTable',
    help: 'VOTable XML format',
    ext: 'xml',
    value: 'votable',
  },
};

export const citationFormatIds = [ExportApiFormatKey.agu, ExportApiFormatKey.ams, ExportApiFormatKey.gsa];

export const citationFormats = pick(citationFormatIds, exportFormats);
