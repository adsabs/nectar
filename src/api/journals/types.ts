export interface IADSApiJournalsJournalParams {
  term: string;
}

export interface IADSApiJournalsJournalResponse {
  journal: [
    {
      bibstem: string;
      name: string;
    },
  ];
}

export interface IADSApiJournalsSummaryParams {
  bibstem: string;
}

export interface IADSApiJournalsSummaryResponse {
  summary: {
    master: {
      bibstem: string;
      journal_name: string;
      primary_language: string;
      multilingual: boolean;
      defunct: boolean;
      pubtype: string;
      refereed: string;
      collection: string;
      notes: string;
      not_indexed: boolean;
    };
    idents: {
      id_type: string;
      id_value: string;
    }[];
    abbrev: string[];
    pubhist: [
      {
        publisher: string;
        title: {
          year_start: number;
          year_end: number;
          vol_start: string;
          vol_end: string;
          complete: string;
          successor_masterid: number;
          notes: string;
        };
      },
    ];
    names: {
      name_english_translated: string;
      title_language: string;
      name_native_language: string;
      name_normalized: string;
    };
  };
}
