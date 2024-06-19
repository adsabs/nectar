export interface IADSApiResolverParams {
  bibcode: string;
  link_type: string; // TODO: https://ui.adsabs.harvard.edu/help/api/api-docs.html#tag--resolver
}

export interface IADSApiResolverResponse {
  action: string;
  links: {
    count: number;
    link_type: string;
    records: [
      {
        bibcode: string;
        count: number;
        title: string;
        type: string;
        url: string;
      },
    ];
  };
  error?: string;
}
