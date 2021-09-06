export enum PaperFormType {
  JOURNAL_QUERY = 'journal-query',
  REFERENCE_QUERY = 'reference-query',
  BIBCODE_QUERY = 'bibcode-query',
}

export interface PaperFormParams {
  // journal-query
  bibstem: string;
  year: string;
  volume: string;
  page: string;

  // reference-query
  reference: string;

  // bibcode-query
  bibcodes: string[];
}

export type RawPaperFormParams = {
  [Property in keyof PaperFormParams]: string;
};
