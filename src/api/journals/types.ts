export interface IADSApiJournalsJournalParams {
  term: string;
}

export interface IADSApiJournal {
  bibstem: string;
  name: string;
}

export interface IADSApiJournalsJournalResponse {
  journal: IADSApiJournal[];
}

export interface IADSApiJournalsSummaryParams {
  bibstem: string;
}

export interface IADSApiJournalsSummaryResponse {
  browse?: {
    canonical_name: string;
    classic_bibstem: string;
    canonical_abbreviation: string;
    primary_language: string;
    native_language_title: string;
    title_language: string;
    completeness_estimate: string;
    external_identifiers: {
      id_type: string;
      id_value: string;
    }[];
    publication_history: {
      publisher: string;
      start_year: string;
      start_volume: string;
    }[];
  };
  Error?: string;
  'Error Info'?: string;
}

export interface IADSApiJournalsISSNParams {
  issn: string;
}

export interface IADSApiJournalsISSNResponse {
  issn?: {
    ISSN: string;
    ISSN_type: string;
    bibstem: string;
    journal_name: string;
  };
}

// Journal autocomplete types
export interface IJournalSearchParams {
  term: string;
  fieldType?: 'pub' | 'bibstem' | 'pub_abbrev';
}

export interface IJournalOption {
  id: number;
  value: string;
  label: string;
  desc: string;
  bibstem: string;
  pub: string;
  pub_abbrev?: string;
}

export interface IJournalSearchResponse {
  journals: IJournalOption[];
  error?: string;
}
