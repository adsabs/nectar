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

export enum PapersHistogramKey {
  AP = 'all publications',
  APN = 'all publications normalized',
  RP = 'refereed publications',
  RPN = 'refereed publications normalized',
}

export enum PublicationsHistogramKey {
  AP = 'all publications',
  APN = 'all publications normalized',
  RP = 'refereed publications',
  RPN = 'refereed publications normalized',
}

export enum DownloadsHistogramKey {
  AD = 'all downloads',
  ADN = 'all downloads normalized',
  RD = 'refereed downloads',
  RDN = 'refereed downloads normalized',
}

export enum MetricsResponseKey {
  BS = 'basic stats',
  BSR = 'basic stats refereed',
  CS = 'citation stats',
  CSR = 'citation stats refereed',
  I = 'indicators',
  IR = 'indicators refereed',
  TS = 'time series',
  SB = 'skipped bibcodes',
  H = 'histograms',
  E = 'Error',
  EI = 'Error Info',
}

export enum TimeSeriesKey {
  G = 'g',
  H = 'h',
  M = 'm',
  I10 = 'i10',
  I100 = 'i100',
  READ10 = 'read10',
  TORI = 'tori',
  RIQ = 'riq',
}

export type CitationsHistogramType = {
  [key in CitationsHistogramKey]: { [year: string]: number };
};

export type ReadsHistogramType = {
  [key in ReadsHistogramKey]: { [year: string]: number };
};

export type PapersHistogramType = {
  [key in PapersHistogramKey]: { [year: string]: number };
};

export type DownloadsHistogramType = {
  [key in DownloadsHistogramKey]: { [year: string]: number };
};

export type TimeSeriesType = {
  [key in TimeSeriesKey]?: { [year: string]: number };
};
export interface IADSApiMetricsParams {
  bibcode?: string;
  bibcodes?: string[];
  types?: ('simple' | 'indicators' | 'timeseries')[];
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
    publications: PapersHistogramType;
    downloads: DownloadsHistogramType;
  };
  [MetricsResponseKey.I]?: {
    [key in TimeSeriesKey]?: number;
  };
  [MetricsResponseKey.IR]?: {
    [key in TimeSeriesKey]?: number;
  };
  [MetricsResponseKey.TS]?: TimeSeriesType;
  [MetricsResponseKey.SB]?: string[];
  [MetricsResponseKey.E]?: string;
  [MetricsResponseKey.EI]?: string;
}
