export interface IADSApiReferenceParams {
  reference: string;
}

export interface IADSApiReferenceResponse {
  resolved: {
    score: string;
    bibcode: string;
    refstring: string;
    comment: string;
  };
}
