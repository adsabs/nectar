export interface IADSApiMetricsParams {
  bibcode: string;
}

export type CitationsHistogramKey =
  | 'nonrefereed to nonrefereed'
  | 'nonrefereed to nonrefereed normalized'
  | 'nonrefereed to refereed'
  | 'nonrefereed to refereed normalized'
  | 'refereed to nonrefereed'
  | 'refereed to nonrefereed normalized'
  | 'refereed to refereed'
  | 'refereed to refereed normalized';

export type ICitationsHistogram = Record<CitationsHistogramKey, { year: number }>;

export type ReadsHistogramKey = 'all reads' | 'all reads normalized' | 'refereed reads' | 'refereed reads normalized';

export type IReadsHistogram = Record<ReadsHistogramKey, { year: number }>;
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
