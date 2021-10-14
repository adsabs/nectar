import { CitationsHistogramType, ReadsHistogramType } from '@api';
import { BasicStatsKey, CitationsHistogramKey, CitationsStatsKey, ReadsHistogramKey } from '@api/lib/metrics/types';
import { ICitationsTableData, IReadsTableData } from './types';

export interface IGraphData {
  key: string;
  values: IPair[];
}

export interface IPair {
  x: string;
  y: number;
}
export interface ICitationTableInput {
  refereed: {
    [CitationsStatsKey.NORMALIZED_NUMBER_OF_CITATIONS]: number;
    [CitationsStatsKey.AVERAGE_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.MEDIAN_NUMBER_OF_CITATIONS]: number;
    [CitationsStatsKey.MEDIAN_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.NUMBER_OF_CITING_PAPERS]: number;
    [CitationsStatsKey.AVERAGE_NUMBER_OF_CITATIONS]: number;
    [CitationsStatsKey.TOTAL_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.NORMALIZED_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.NUMBER_OF_SELF_CITATIONS]: number;
    [CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS]: number;
  };
  total: {
    [CitationsStatsKey.NUMBER_OF_SELF_CITATIONS]: number;
    [CitationsStatsKey.AVERAGE_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.MEDIAN_NUMBER_OF_CITATIONS]: number;
    'self-citations': string[];
    [CitationsStatsKey.NUMBER_OF_CITING_PAPERS]: number;
    [CitationsStatsKey.AVERAGE_NUMBER_OF_CITATIONS]: number;
    [CitationsStatsKey.TOTAL_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.NORMALIZED_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.MEDIAN_NUMBER_OF_REFEREED_CITATIONS]: number;
    [CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS]: number;
    [CitationsStatsKey.NORMALIZED_NUMBER_OF_CITATIONS]: number;
  };
}
export interface IReadTableInput {
  refereed: {
    [BasicStatsKey.MEDIAN_NUMBER_OF_DOWNLOADS]: number;
    [BasicStatsKey.AVERAGE_NUMBER_OF_READS]: number;
    [BasicStatsKey.NORMALIZED_PAPER_COUNT]: number;
    [BasicStatsKey.RECENT_NUMBER_OF_READS]: number;
    [BasicStatsKey.NUMBER_OF_PAPERS]: number;
    [BasicStatsKey.RECENT_NUMBER_OF_DOWNLOADS]: number;
    [BasicStatsKey.TOTAL_NUMBER_OF_READS]: number;
    [BasicStatsKey.MEDIAN_NUMBER_OF_READS]: number;
    [BasicStatsKey.TOTAL_NUMBER_OF_DOWNLOADS]: number;
    [BasicStatsKey.AVERAGE_NUMBER_OF_DOWNLOADS]: number;
  };
  total: {
    [BasicStatsKey.MEDIAN_NUMBER_OF_DOWNLOADS]: number;
    [BasicStatsKey.AVERAGE_NUMBER_OF_READS]: number;
    [BasicStatsKey.NORMALIZED_PAPER_COUNT]: number;
    [BasicStatsKey.RECENT_NUMBER_OF_READS]: number;
    [BasicStatsKey.NUMBER_OF_PAPERS]: number;
    [BasicStatsKey.RECENT_NUMBER_OF_DOWNLOADS]: number;
    [BasicStatsKey.TOTAL_NUMBER_OF_READS]: number;
    [BasicStatsKey.MEDIAN_NUMBER_OF_READS]: number;
    [BasicStatsKey.TOTAL_NUMBER_OF_DOWNLOADS]: number;
    [BasicStatsKey.AVERAGE_NUMBER_OF_DOWNLOADS]: number;
  };
}

export const plotCitationsHist = (normalize: boolean, citationsHist: CitationsHistogramType): IGraphData[] => {
  const returnArray: IPair[][] = [];
  let data: { year: number }[];

  if (!normalize) {
    data = [
      citationsHist[CitationsHistogramKey.REFEREED_TO_REFEREED],
      citationsHist[CitationsHistogramKey.NONREFEREED_TO_NONREFEREED],
      citationsHist[CitationsHistogramKey.NONREFEREED_TO_REFEREED],
      citationsHist[CitationsHistogramKey.NONREFEREED_TO_NONREFEREED],
    ];
  } else {
    data = [
      citationsHist[CitationsHistogramKey.REFEREED_TO_REFEREED_NORMALIZED],
      citationsHist[CitationsHistogramKey.REFEREED_TO_NONREFEREED_NORMALIZED],
      citationsHist[CitationsHistogramKey.NONREFEREED_TO_REFEREED_NORMALIZED],
      citationsHist[CitationsHistogramKey.NONREFEREED_TO_NONREFEREED_NORMALIZED],
    ];
  }

  data.forEach((a) => {
    const transformedArray: IGraphData['values'] = [];
    Object.entries(a).forEach(([k, v]) => {
      transformedArray.push({ x: k, y: v });
    });
    returnArray.push(transformedArray);
  });

  // now, filter to only include arrays with at least 1 non-zero val

  return [
    'Ref. citations to ref. papers',
    'Ref. citations to non ref. papers',
    'Non ref. citations to ref. papers',
    'Non ref. citations to non ref. papers',
  ]
    .map(function (x, i) {
      return {
        key: x,
        values: returnArray[i],
      };
    })
    .filter(function (x) {
      return hasNonZero(x.values);
    });
};

export const plotReadsHist = (normalize: boolean, readsHist: ReadsHistogramType): IGraphData[] => {
  let data: { [key: string]: number | string }[];
  const returnArray: IPair[][] = [];

  if (!normalize) {
    data = [
      readsHist[ReadsHistogramKey.REFEREED_READS],
      getNonRef(readsHist[ReadsHistogramKey.REFEREED_READS], readsHist[ReadsHistogramKey.ALL_READS]),
    ];
  } else {
    data = [
      readsHist[ReadsHistogramKey.REFEREED_READS_NORMALIZED],
      getNonRef(
        readsHist[ReadsHistogramKey.REFEREED_READS_NORMALIZED],
        readsHist[ReadsHistogramKey.ALL_READS_NORMALIZED],
      ),
    ];
  }

  data.forEach((a) => {
    const transformedArray = [];
    Object.entries(a).forEach(([k, v]) => {
      transformedArray.push({ x: k, y: v });
    });
    returnArray.push(transformedArray);
  });

  return [
    { key: 'Refereed', values: returnArray[0] },
    { key: 'Non-refereed', values: returnArray[1] },
  ].filter(function (x) {
    return hasNonZero(x.values);
  });
};

export const getCitationTableData = (citationData: ICitationTableInput): ICitationsTableData => {
  const data = {
    numberOfCitingPapers: [
      citationData.total[CitationsStatsKey.NUMBER_OF_CITING_PAPERS],
      citationData.refereed[CitationsStatsKey.NUMBER_OF_CITING_PAPERS],
    ],
    totalCitations: [
      citationData.total[CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS],
      citationData.refereed[CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS],
    ],
    numberOfSelfCitations: [
      citationData.total[CitationsStatsKey.NUMBER_OF_SELF_CITATIONS],
      citationData.refereed[CitationsStatsKey.NUMBER_OF_SELF_CITATIONS],
    ],
    averageCitations: [
      citationData.total[CitationsStatsKey.AVERAGE_NUMBER_OF_CITATIONS],
      citationData.refereed[CitationsStatsKey.AVERAGE_NUMBER_OF_CITATIONS],
    ],
    medianCitations: [
      citationData.total[CitationsStatsKey.MEDIAN_NUMBER_OF_CITATIONS],
      citationData.refereed[CitationsStatsKey.MEDIAN_NUMBER_OF_CITATIONS],
    ],
    normalizedCitations: [
      citationData.total[CitationsStatsKey.NORMALIZED_NUMBER_OF_CITATIONS],
      citationData.refereed[CitationsStatsKey.NORMALIZED_NUMBER_OF_CITATIONS],
    ],
    refereedCitations: [
      citationData.total[CitationsStatsKey.TOTAL_NUMBER_OF_REFEREED_CITATIONS],
      citationData.refereed[CitationsStatsKey.TOTAL_NUMBER_OF_REFEREED_CITATIONS],
    ],
    averageRefereedCitations: [
      citationData.total[CitationsStatsKey.AVERAGE_NUMBER_OF_REFEREED_CITATIONS],
      citationData.refereed[CitationsStatsKey.AVERAGE_NUMBER_OF_REFEREED_CITATIONS],
    ],
    medianRefereedCitations: [
      citationData.total[CitationsStatsKey.MEDIAN_NUMBER_OF_REFEREED_CITATIONS],
      citationData.refereed[CitationsStatsKey.MEDIAN_NUMBER_OF_REFEREED_CITATIONS],
    ],
    normalizedRefereedCitations: [
      citationData.total[CitationsStatsKey.NORMALIZED_NUMBER_OF_REFEREED_CITATIONS],
      citationData.refereed[CitationsStatsKey.NORMALIZED_NUMBER_OF_REFEREED_CITATIONS],
    ],
  };

  Object.entries(data).forEach(([name, arr]) => {
    data[name] = [limitPlaces(arr[0]), limitPlaces(arr[1])];
  });

  return data;
};

export const getReadsTableData = (generalData: IReadTableInput): IReadsTableData => {
  const data = {
    totalNumberOfReads: [
      generalData.total[BasicStatsKey.TOTAL_NUMBER_OF_READS],
      generalData.refereed[BasicStatsKey.TOTAL_NUMBER_OF_READS],
    ],
    averageNumberOfReads: [
      generalData.total[BasicStatsKey.AVERAGE_NUMBER_OF_READS],
      generalData.refereed[BasicStatsKey.AVERAGE_NUMBER_OF_READS],
    ],
    medianNumberOfReads: [
      generalData.total[BasicStatsKey.MEDIAN_NUMBER_OF_READS],
      generalData.refereed[BasicStatsKey.MEDIAN_NUMBER_OF_READS],
    ],
    totalNumberOfDownloads: [
      generalData.total[BasicStatsKey.TOTAL_NUMBER_OF_DOWNLOADS],
      generalData.refereed[BasicStatsKey.TOTAL_NUMBER_OF_DOWNLOADS],
    ],
    averageNumberOfDownloads: [
      generalData.total[BasicStatsKey.AVERAGE_NUMBER_OF_DOWNLOADS],
      generalData.refereed[BasicStatsKey.AVERAGE_NUMBER_OF_DOWNLOADS],
    ],
    medianNumberOfDownloads: [
      generalData.total[BasicStatsKey.MEDIAN_NUMBER_OF_DOWNLOADS],
      generalData.total[BasicStatsKey.MEDIAN_NUMBER_OF_DOWNLOADS],
    ],
  };

  Object.entries(data).forEach(([name, arr]) => {
    data[name] = [limitPlaces(arr[0]), limitPlaces(arr[1])];
  });

  return data;
};

const hasNonZero = (arr: IPair[]) => {
  return (
    arr.filter((x) => {
      return x.y > 0;
    }).length > 0
  );
};

const getNonRef = (ref: { [key: string]: number }, all: { [key: string]: number }) => {
  const nonRef = {};
  Object.entries(all).forEach(([k, v]) => {
    if (ref[k]) {
      nonRef[k] = v - ref[k];
    } else {
      nonRef[k] = v;
    }
  });
  return nonRef;
};

function limitPlaces(n: number): number {
  if (!n) {
    return n;
  }
  const stringNum = n.toString();
  if (stringNum.indexOf('.') > -1 && stringNum.split('.')[1]) {
    return Number(n.toFixed(1));
  }
  return n;
}
