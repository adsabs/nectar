export interface IADSApiReferenceParams {
  reference: string | string[];
}

export interface IADSApiReferenceResponse {
  resolved: {
    score: string;
    bibcode: string;
    refstring: string;
    comment?: string;
  };
}
