export interface IADSApiMetricsParams {
  bibcode: string;
}

export interface ICitationsHistogram {
  'nonrefereed to nonrefereed': {
    year: number;
  };
  'nonrefereed to nonrefereed normalized': {
    year: number;
  };
  'nonrefereed to refereed': {
    year: number;
  };
  'nonrefereed to refereed normalized': {
    year: number;
  };
  'refereed to nonrefereed': {
    year: number;
  };
  'refereed to nonrefereed normalized': {
    year: number;
  };
  'refereed to refereed': {
    year: number;
  };
  'refereed to refereed normalized': {
    year: number;
  };
}

export interface IReadsHistogram {
  'all reads': {
    year: number;
  };
  'all reads normalized': {
    year: number;
  };
  'refereed reads': {
    year: number;
  };
  'refereed reads normalized': {
    year: number;
  };
}

export interface IADSApiMetricsResponse {
  'basic stats': {
    'average number of downloads': number;
    'average number of reads': number;
    'median number of downloads': number;
    'median number of reads': number;
    'normalized paper count': number;
    'number of papers': number;
    'recent number of downloads': number;
    'recent number of reads': number;
    'total number of downloads': number;
    'total number of reads': number;
  };
  'basic stats refereed': {
    'average number of downloads': number;
    'average number of reads': number;
    'median number of downloads': number;
    'median number of reads': number;
    'normalized paper count': number;
    'number of papers': number;
    'recent number of downloads': number;
    'recent number of reads': number;
    'total number of downloads': number;
    'total number of reads': number;
  };
  'citation stats': {
    'average number of citations': number;
    'average number of refereed citations': number;
    'median number of citations': number;
    'median number of refereed citations': number;
    'normalized number of citations': number;
    'normalized number of refereed citations': number;
    'number of citing papers': number;
    'number of self-citations': number;
    'self-citations': string[];
    'total number of citations': number;
    'total number of refereed citations': number;
  };
  'citation stats refereed': {
    'average number of citations': number;
    'average number of refereed citations': number;
    'median number of citations': number;
    'median number of refereed citations': number;
    'normalized number of citations': number;
    'normalized number of refereed citations': number;
    'number of citing papers': number;
    'number of self-citations': number;
    'self-citations': ['string'];
    'total number of citations': number;
    'total number of refereed citations': number;
  };
  histograms: {
    citations: ICitationsHistogram;
    reads: IReadsHistogram;
  };
  'skipped bibcodes': string[];
  Error: string;
}
