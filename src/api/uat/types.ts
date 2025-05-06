export interface IUATTerm {
  name: string;
  altNames: string[];
}

export interface IUATTermsSearchReponse {
  uatTerms: IUATTerm[];
  error?: string;
}

export interface IATTermsSearchParams {
  term: string;
}
