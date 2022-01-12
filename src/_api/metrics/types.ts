export enum CitationsHistogramKey {
  NN = 'nonrefereed to nonrefereed',
  NNN = 'nonrefereed to nonrefereed normalized',
  NR = 'nonrefereed to refereed',
  NRN = 'nonrefereed to refereed normalized',
  RN = 'refereed to nonrefereed',
  RNN = 'refereed to nonrefereed normalized',
  RR = 'refereed to refereed',
  RRN = 'refereed to refereed normalized',
}

export enum BasicStatsKey {
  AND = 'average number of downloads',
  ANR = 'average number of reads',
  MND = 'median number of downloads',
  MNR = 'median number of reads',
  NPC = 'normalized paper count',
  NP = 'number of papers',
  RND = 'recent number of downloads',
  RNR = 'recent number of reads',
  TND = 'total number of downloads',
  TNR = 'total number of reads',
}

export enum CitationsStatsKey {
  ANC = 'average number of citations',
  ANRC = 'average number of refereed citations',
  MNC = 'median number of citations',
  MNRC = 'median number of refereed citations',
  NNC = 'normalized number of citations',
  NNRC = 'normalized number of refereed citations',
  NCP = 'number of citing papers',
  NSC = 'number of self-citations',
  TNC = 'total number of citations',
  TNRC = 'total number of refereed citations',
}

export enum ReadsHistogramKey {
  AR = 'all reads',
  ARN = 'all reads normalized',
  RR = 'refereed reads',
  RRN = 'refereed reads normalized',
}

export enum MetricsResponseKey {
  BS = 'basic stats',
  BSR = 'basic stats refereed',
  CS = 'citation stats',
  CSR = 'citation stats refereed',
  SB = 'skipped bibcodes',
  H = 'histograms',
  E = 'Error',
  EI = 'Error Info',
}

export type CitationsHistogramType = {
  [key in CitationsHistogramKey]: { year: number };
};

export type ReadsHistogramType = {
  [key in ReadsHistogramKey]: { year: number };
};

export interface IADSApiMetricsParams {
  bibcode: string;
}

export interface IADSApiMetricsResponse {
  [MetricsResponseKey.BS]?: { [key in BasicStatsKey]: number };
  [MetricsResponseKey.BSR]?: { [key in BasicStatsKey]: number };
  [MetricsResponseKey.CS]?: {
    [key in CitationsStatsKey]: number;
  } & { 'self-citations': string[] };
  [MetricsResponseKey.CSR]?: {
    [key in CitationsStatsKey]: number;
  };
  [MetricsResponseKey.H]?: {
    citations: CitationsHistogramType;
    reads: ReadsHistogramType;
  };
  [MetricsResponseKey.SB]?: string[];
  [MetricsResponseKey.E]?: string;
  [MetricsResponseKey.EI]?: string;
}
