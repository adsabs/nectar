import { CitationsHistogramType, ReadsHistogramType } from '@api';
import { BasicStatsKey, CitationsHistogramKey, CitationsStatsKey, ReadsHistogramKey } from '@_api/metrics/types';
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
    [key in CitationsStatsKey]: number;
  };
  total: {
    [key in CitationsStatsKey]: number;
  } & { 'self-citations': string[] };
}
export interface IReadTableInput {
  refereed: {
    [key in BasicStatsKey]: number;
  };
  total: {
    [key in BasicStatsKey]: number;
  };
}

export const plotCitationsHist = (normalize: boolean, citationsHist: CitationsHistogramType): IGraphData[] => {
  const returnArray: IPair[][] = [];
  let data: { [year: string]: number }[];

  if (!normalize) {
    data = [
      citationsHist[CitationsHistogramKey.RR],
      citationsHist[CitationsHistogramKey.NN],
      citationsHist[CitationsHistogramKey.NR],
      citationsHist[CitationsHistogramKey.NN],
    ];
  } else {
    data = [
      citationsHist[CitationsHistogramKey.RRN],
      citationsHist[CitationsHistogramKey.RNN],
      citationsHist[CitationsHistogramKey.NRN],
      citationsHist[CitationsHistogramKey.NNN],
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
      readsHist[ReadsHistogramKey.RR],
      getNonRef(readsHist[ReadsHistogramKey.RR], readsHist[ReadsHistogramKey.AR]),
    ];
  } else {
    data = [
      readsHist[ReadsHistogramKey.RRN],
      getNonRef(readsHist[ReadsHistogramKey.RRN], readsHist[ReadsHistogramKey.ARN]),
    ];
  }

  data.forEach((a) => {
    const transformedArray: IPair[] = [];
    Object.entries(a).forEach(([k, v]) => {
      transformedArray.push({ x: k, y: v as number });
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
    numberOfCitingPapers: [citationData.total[CitationsStatsKey.NCP], citationData.refereed[CitationsStatsKey.NCP]],
    totalCitations: [citationData.total[CitationsStatsKey.TNC], citationData.refereed[CitationsStatsKey.TNC]],
    numberOfSelfCitations: [citationData.total[CitationsStatsKey.NSC], citationData.refereed[CitationsStatsKey.NSC]],
    averageCitations: [citationData.total[CitationsStatsKey.ANC], citationData.refereed[CitationsStatsKey.ANC]],
    medianCitations: [citationData.total[CitationsStatsKey.MNC], citationData.refereed[CitationsStatsKey.MNC]],
    normalizedCitations: [citationData.total[CitationsStatsKey.NNC], citationData.refereed[CitationsStatsKey.NNC]],
    refereedCitations: [citationData.total[CitationsStatsKey.TNRC], citationData.refereed[CitationsStatsKey.TNRC]],
    averageRefereedCitations: [
      citationData.total[CitationsStatsKey.ANRC],
      citationData.refereed[CitationsStatsKey.ANRC],
    ],
    medianRefereedCitations: [
      citationData.total[CitationsStatsKey.MNRC],
      citationData.refereed[CitationsStatsKey.MNRC],
    ],
    normalizedRefereedCitations: [
      citationData.total[CitationsStatsKey.NNRC],
      citationData.refereed[CitationsStatsKey.NNRC],
    ],
  };

  Object.entries(data).forEach(([name, arr]) => {
    data[name as keyof typeof data] = [limitPlaces(arr[0]), limitPlaces(arr[1])];
  });

  return data;
};

export const getReadsTableData = (generalData: IReadTableInput): IReadsTableData => {
  const data = {
    totalNumberOfReads: [generalData.total[BasicStatsKey.TNR], generalData.refereed[BasicStatsKey.TNR]],
    averageNumberOfReads: [generalData.total[BasicStatsKey.ANR], generalData.refereed[BasicStatsKey.ANR]],
    medianNumberOfReads: [generalData.total[BasicStatsKey.MNR], generalData.refereed[BasicStatsKey.MNR]],
    totalNumberOfDownloads: [generalData.total[BasicStatsKey.TND], generalData.refereed[BasicStatsKey.TND]],
    averageNumberOfDownloads: [generalData.total[BasicStatsKey.AND], generalData.refereed[BasicStatsKey.AND]],
    medianNumberOfDownloads: [generalData.total[BasicStatsKey.MND], generalData.total[BasicStatsKey.MND]],
  };

  Object.entries(data).forEach(([name, arr]) => {
    data[name as keyof typeof data] = [limitPlaces(arr[0]), limitPlaces(arr[1])];
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
  const nonRef: Record<string, number> = {};
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
