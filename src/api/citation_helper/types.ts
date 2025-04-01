export interface ICitationHelperParams {
  bibcodes: string[];
}

export interface ISuggestionEntry {
  bibcode: string;
  score: number;
  title: string;
  author: string;
}

export type ICitationHelperResponse =
  | ISuggestionEntry[]
  | {
      Error?: string;
      'Error Info'?: string;
    };
