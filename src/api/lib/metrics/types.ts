export enum CitationsHistogramKey {
  NONREFEREED_TO_NONREFEREED = 'nonrefereed to nonrefereed',
  NONREFEREED_TO_NONREFEREED_NORMALIZED = 'nonrefereed to nonrefereed normalized',
  NONREFEREED_TO_REFEREED = 'nonrefereed to refereed',
  NONREFEREED_TO_REFEREED_NORMALIZED = 'nonrefereed to refereed normalized',
  REFEREED_TO_NONREFEREED = 'refereed to nonrefereed',
  REFEREED_TO_NONREFEREED_NORMALIZED = 'refereed to nonrefereed normalized',
  REFEREED_TO_REFEREED = 'refereed to refereed',
  REFEREED_TO_REFEREED_NORMALIZED = 'refereed to refereed normalized',
}

export enum BasicStatsKey {
  AVERAGE_NUMBER_OF_DOWNLOADS = 'average number of downloads',
  AVERAGE_NUMBER_OF_READS = 'average number of reads',
  MEDIAN_NUMBER_OF_DOWNLOADS = 'median number of downloads',
  MEDIAN_NUMBER_OF_READS = 'median number of reads',
  NORMALIZED_PAPER_COUNT = 'normalized paper count',
  NUMBER_OF_PAPERS = 'number of papers',
  RECENT_NUMBER_OF_DOWNLOADS = 'recent number of downloads',
  RECENT_NUMBER_OF_READS = 'recent number of reads',
  TOTAL_NUMBER_OF_DOWNLOADS = 'total number of downloads',
  TOTAL_NUMBER_OF_READS = 'total number of reads',
}

export enum CitationsStatsKey {
  AVERAGE_NUMBER_OF_CITATIONS = 'average number of citations',
  AVERAGE_NUMBER_OF_REFEREED_CITATIONS = 'average number of refereed citations',
  MEDIAN_NUMBER_OF_CITATIONS = 'median number of citations',
  MEDIAN_NUMBER_OF_REFEREED_CITATIONS = 'median number of refereed citations',
  NORMALIZED_NUMBER_OF_CITATIONS = 'normalized number of citations',
  NORMALIZED_NUMBER_OF_REFEREED_CITATIONS = 'normalized number of refereed citations',
  NUMBER_OF_CITING_PAPERS = 'number of citing papers',
  NUMBER_OF_SELF_CITATIONS = 'number of self-citations',
  TOTAL_NUMBER_OF_CITATIONS = 'total number of citations',
  TOTAL_NUMBER_OF_REFEREED_CITATIONS = 'total number of refereed citations',
}

export enum ReadsHistogramKey {
  ALL_READS = 'all reads',
  ALL_READS_NORMALIZED = 'all reads normalized',
  REFEREED_READS = 'refereed reads',
  REFEREED_READS_NORMALIZED = 'refereed reads normalized',
}

export enum MetricsResponseKey {
  BASIC_STATS = 'basic stats',
  BASIC_STATS_REFEREED = 'basic stats refereed',
  CITATION_STATS = 'citation stats',
  CITATION_STATS_REFEREED = 'citation stats refereed',
  SKIPPED_BIBCODES = 'skipped bibcodes',
  HISTOGRAMS = 'histograms',
  ERROR = 'Error',
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
  [MetricsResponseKey.BASIC_STATS]: { [key in BasicStatsKey]: number };
  [MetricsResponseKey.BASIC_STATS_REFEREED]: { [key in BasicStatsKey]: number };
  [MetricsResponseKey.CITATION_STATS]: {
    [key in CitationsStatsKey]: number;
  } & { 'self-citations': string[] };
  [MetricsResponseKey.CITATION_STATS_REFEREED]: {
    [key in CitationsStatsKey]: number;
  } & { 'self-citations': string[] };
  [MetricsResponseKey.HISTOGRAMS]: {
    citations: CitationsHistogramType;
    reads: ReadsHistogramType;
  };
  [MetricsResponseKey.SKIPPED_BIBCODES]: string[];
  [MetricsResponseKey.ERROR]: string;
}
