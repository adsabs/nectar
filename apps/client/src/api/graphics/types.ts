export interface IADSApiGraphicsParams {
  bibcode: string;
}

export interface IADSApiGraphicsResponse {
  bibcode: string;
  number: number;
  pick: string;
  header: string;
  figures: [
    {
      figure_label: string;
      figure_caption: string;
      figure_type: string;
      images: [
        {
          thumbnail: string;
          highres: string;
        },
      ];
    },
  ];
  Error?: string;
  'Error Info'?: string;
}
