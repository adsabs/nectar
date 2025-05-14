export interface IUATTerm {
  name: string;
  uri: string;
  altNames: string[];
  narrower: { name: string; uri: string }[];
  broader: { name: string; uri: string }[];
  related: { name: string; uri: string }[];
}

export interface IUATTermsSearchReponse {
  uatTerms: IUATTerm[];
  error?: string;
}

export interface IATTermsSearchParams {
  term: string;
  exact?: boolean;
}
