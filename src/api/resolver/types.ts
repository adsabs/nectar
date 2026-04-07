export interface IADSApiResolverParams {
  bibcode: string;
  link_type: string; // TODO: https://ui.adsabs.harvard.edu/help/api/api-docs.html#tag--resolver
}

export interface IADSApiResolverResponse {
  action: string; // display, redirect
  link?: string;
  link_type?: string; // TODO: https://ui.adsabs.harvard.edu/help/api/api-docs.html#tag--resolver
  links?: {
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
