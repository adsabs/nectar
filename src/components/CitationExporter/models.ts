import { SelectOption } from '@components/Select';
import { ExportApiFormatKey } from '@_api/export';

export type ExportFormat = SelectOption<ExportApiFormatKey> & { ext: string };

export const exportFormats: Record<ExportApiFormatKey, ExportFormat> = {
  bibtex: {
    id: ExportApiFormatKey.bibtex,
    label: 'BibTeX',
    help: 'BibTeX format',
    ext: 'bib',
    value: 'bibtex',
  },
  ads: {
    id: ExportApiFormatKey.ads,
    label: 'ADS',
    help: 'ADS format',
    ext: 'txt',
    value: 'ads',
  },
  bibtexabs: {
    id: ExportApiFormatKey.bibtexabs,
    label: 'BibTeX ABS',
    help: 'BibTeX with abstracts',
    ext: 'bib',
    value: 'bibtexabs',
  },
  endnote: {
    id: ExportApiFormatKey.endnote,
    label: 'EndNote',
    help: 'EndNote format',
    ext: 'enw',
    value: 'endnote',
  },
  procite: {
    id: ExportApiFormatKey.procite,
    label: 'ProCite',
    help: 'ProCite format',
    ext: 'txt',
    value: 'procite',
  },
  ris: {
    id: ExportApiFormatKey.ris,
    label: 'RIS',
    help: 'Research Information Systems (RIS) format',
    ext: 'txt',
    value: 'ris',
  },
  refworks: {
    id: ExportApiFormatKey.refworks,
    label: 'RefWorks',
    help: 'RefWorks format',
    ext: 'txt',
    value: 'refworks',
  },
  rss: {
    id: ExportApiFormatKey.rss,
    label: 'RSS',
    help: 'RSS format',
    ext: 'rss',
    value: 'rss',
  },
  medlars: {
    id: ExportApiFormatKey.medlars,
    label: 'MEDLARS',
    help: 'Medical Literature Analysis and Retrieval System (MEDLARS) format',
    ext: 'txt',
    value: 'medlars',
  },
  dcxml: {
    id: ExportApiFormatKey.dcxml,
    label: 'DC-XML',
    help: 'Dublin Core XML format',
    ext: 'xml',
    value: 'dcxml',
  },
  refxml: {
    id: ExportApiFormatKey.refxml,
    label: 'REF-XML',
    help: 'ADS link data in XML format',
    ext: 'xml',
    value: 'refxml',
  },
  refabsxml: {
    id: ExportApiFormatKey.refabsxml,
    label: 'REFABS-XML',
    help: 'ADS records in XML format',
    ext: 'xml',
    value: 'refabsxml',
  },
  aastex: {
    id: ExportApiFormatKey.aastex,
    label: 'AASTeX',
    help: 'LaTeX format for AAS journals',
    ext: 'txt',
    value: 'aastex',
  },
  ieee: {
    id: ExportApiFormatKey.ieee,
    label: 'IEEE',
    help: 'IEEE format',
    ext: 'txt',
    value: 'ieee',
  },
  icarus: {
    id: ExportApiFormatKey.icarus,
    label: 'Icarus',
    help: 'LaTeX format for use in Icarus',
    ext: 'txt',
    value: 'icarus',
  },
  mnras: {
    id: ExportApiFormatKey.mnras,
    label: 'MNRAS',
    help: 'LaTeX format for use in MNRAS',
    ext: 'txt',
    value: 'mnras',
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
  custom: {
    id: ExportApiFormatKey.custom,
    label: 'Custom Format',
    help: 'Enter Your Own Custom Format',
    ext: 'txt',
    value: 'custom',
  },
};
