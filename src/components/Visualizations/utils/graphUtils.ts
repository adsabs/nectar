import {
  BasicStatsKey,
  CitationsHistogramKey,
  CitationsHistogramType,
  CitationsStatsKey,
  IBucket,
  IFacetCountsFields,
  PapersHistogramKey,
  PapersHistogramType,
  ReadsHistogramKey,
  ReadsHistogramType,
  TimeSeriesKey,
  TimeSeriesType,
} from '@api';
import { Datum, Serie } from '@nivo/line';
import { divide } from 'ramda';
import {
  IBarGraph,
  ICitationsTableData,
  IIndicesTableData,
  IPapersTableData,
  IReadsTableData,
  ILineGraph,
  ICitationTableInput,
  IIndicesTableInput,
  IPaperTableInput,
  IReadTableInput,
  YearDatum,
} from '../types';

/**
 * Output format
 * [
 *  { year: 2000,
 *      'Ref. citations to ref. papers': 0,
 *      'Ref. citations to non ref. papers': 0,
 *      'Non ref. citations to ref. papers': 0,
 *      'Non ref. citations to non ref. papers': 0 } , ...
 *  ]
 * @param normalize
 * @param citationsHist
 * @returns
 */
export const plotCitationsHist = (
  normalize: boolean,
  citationsHist: CitationsHistogramType,
  isSinglePaper: boolean,
): IBarGraph<Record<string, string | number>> => {
  let data: { [year: string]: number }[];

  if (!normalize) {
    data = [
      citationsHist[CitationsHistogramKey.RR],
      citationsHist[CitationsHistogramKey.RN],
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

  const transformed: { [key: string]: Record<string, number> } = {};

  [
    isSinglePaper ? 'Citations from ref. papers' : 'Ref. citations to ref. papers',
    'Ref. citations to non ref. papers',
    isSinglePaper ? 'Citations from non ref. papers' : 'Non ref. citations to ref. papers',
    'Non ref. citations to non ref. papers',
  ].forEach((x, i) => {
    if (Object.values(data[i]).filter((v) => v > 0).length > 0) {
      // skip if all values are 0
      transformed[x] = data[i];
    }
  });

  const keys = Object.keys(transformed);
  const out = Object.keys(data[0]).map((year) => {
    const obj: Record<string, string | number> = {
      year: year,
    };
    for (const key of keys) {
      obj[key] = transformed[key][year];
    }
    return obj;
  });

  return { data: out, keys, indexBy: 'year' };
};

/**
 * Output format
 * [
 *  { year: 2000,
 *      'Refereed': 0,
 *      'Non-refereed': 0 , ...
 *  ]
 * @param normalize
 * @param readsHist
 * @returns
 */
export const plotReadsHist = (
  normalize: boolean,
  readsHist: ReadsHistogramType,
): IBarGraph<Record<string, string | number>> => {
  let data: Record<string, number>[];

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

  const transformed: Record<string, Record<string, number>> = {};

  ['Refereed', 'Non-refereed'].forEach((x, i) => {
    if (Object.values(data[i]).filter((v) => v > 0).length > 0) {
      // skip if all values are 0
      transformed[x] = data[i];
    }
  });

  const keys = Object.keys(transformed);
  const out = Object.keys(data[0]).map((year) => {
    const obj: Record<string, string | number> = {
      year: year,
    };
    for (const key of keys) {
      obj[key] = transformed[key][year];
    }
    return obj;
  });

  return { data: out, keys, indexBy: 'year' };
};

export const plotPapersHist = (
  normalize: boolean,
  papersHist: PapersHistogramType,
): IBarGraph<Record<string, string | number>> => {
  let data: Record<string, number>[];

  if (!normalize) {
    data = [
      papersHist[PapersHistogramKey.RP],
      getNonRef(papersHist[PapersHistogramKey.RP], papersHist[PapersHistogramKey.AP]),
    ];
  } else {
    data = [
      papersHist[PapersHistogramKey.RPN],
      getNonRef(papersHist[PapersHistogramKey.RPN], papersHist[PapersHistogramKey.APN]),
    ];
  }

  const transformed: Record<string, Record<string, number>> = {};

  ['Refereed', 'Non-refereed'].forEach((x, i) => {
    if (Object.values(data[i]).filter((v) => v > 0).length > 0) {
      // skip if all values are 0
      transformed[x] = data[i];
    }
  });

  const keys = Object.keys(transformed);
  const out = Object.keys(data[0]).map((year) => {
    const obj: Record<string, string | number> = {
      year: year,
    };
    for (const key of keys) {
      obj[key] = transformed[key][year];
    }
    return obj;
  });

  return { data: out, keys, indexBy: 'year' };
};

export const plotTimeSeriesGraph = (timeseries: TimeSeriesType): ILineGraph => {
  const data = [
    timeseries[TimeSeriesKey.H],
    timeseries[TimeSeriesKey.M],
    timeseries[TimeSeriesKey.G],
    timeseries[TimeSeriesKey.I10],
    timeseries[TimeSeriesKey.I100],
    timeseries[TimeSeriesKey.TORI],
    timeseries[TimeSeriesKey.RIQ],
    timeseries[TimeSeriesKey.READ10],
  ];

  const returnArray: Serie[] = [];

  ['h-index', 'm-index', 'g-index', 'i10-index', 'i100-index', 'tori-index', 'riq-index', 'read10-index'].map(
    (id, index) => {
      const d: { x: string; y: number }[] = [];
      if (data[index] !== undefined) {
        Object.entries(data[index]).map(([year, value]) => {
          if (id === 'read10-index') {
            d.push({ x: year, y: divide(value, 10) });
          } else {
            d.push({ x: year, y: value });
          }
        });
        returnArray.push({
          id,
          data: d,
        });
      }
    },
  );

  return { data: returnArray };
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

export const getPapersTableData = (generalData: IPaperTableInput): IPapersTableData => {
  const data = {
    totalNumberOfPapers: [generalData.total[BasicStatsKey.NP], generalData.refereed[BasicStatsKey.NP]],
    totalNormalizedPaperCount: [generalData.total[BasicStatsKey.NPC], generalData.refereed[BasicStatsKey.NPC]],
  };

  Object.entries(data).forEach(([name, arr]) => {
    data[name as keyof typeof data] = [limitPlaces(arr[0]), limitPlaces(arr[1])];
  });

  return data;
};

export const getIndicesTableData = (indicesData: IIndicesTableInput): IIndicesTableData => {
  const data = {
    hIndex: [indicesData.total[TimeSeriesKey.H], indicesData.refereed[TimeSeriesKey.H]],
    mIndex: [indicesData.total[TimeSeriesKey.M], indicesData.refereed[TimeSeriesKey.M]],
    gIndex: [indicesData.total[TimeSeriesKey.G], indicesData.refereed[TimeSeriesKey.G]],
    i10Index: [indicesData.total[TimeSeriesKey.I10], indicesData.refereed[TimeSeriesKey.I10]],
    i100Index: [indicesData.total[TimeSeriesKey.I100], indicesData.refereed[TimeSeriesKey.I100]],
    toriIndex: [indicesData.total[TimeSeriesKey.TORI], indicesData.refereed[TimeSeriesKey.TORI]],
    riqIndex: [indicesData.total[TimeSeriesKey.RIQ], indicesData.refereed[TimeSeriesKey.RIQ]],
    read10Index: [indicesData.total[TimeSeriesKey.READ10], indicesData.refereed[TimeSeriesKey.READ10]],
  };

  Object.entries(data).forEach(([name, arr]) => {
    data[name as keyof typeof data] = [limitPlaces(arr[0]), limitPlaces(arr[1])];
  });

  return data;
};

export const getYearsGraph = (data: IFacetCountsFields): IBarGraph<YearDatum> => {
  const facetData = data.facet_pivot['property,year'];

  const yearMap = new Map<number, { refereed: number; notrefereed: number }>(); // year => {refereed: number, nonefereed: number}

  const keys = ['refereed', 'notrefereed'];

  facetData.forEach(({ value, pivot }) => {
    if (keys.includes(value)) {
      // loop through each pivot and add the years to our map
      pivot.forEach(({ value: yearString, count = 0 }) => {
        const year = parseInt(yearString, 10);
        yearMap.set(year, {
          refereed: 0,
          notrefereed: 0,
          ...yearMap.get(year),
          [value]: count,
        });
      });
    }
  });

  const years = Array.from(yearMap.keys());
  const min = Math.min(...years);
  const max = Math.max(...years);

  // fill in all the years between min and max that don't have values
  const finalData = Array.from({ length: max - min + 1 }, (_v, i) => min + i).map((year) => {
    // if the year exists, then grab it, otherwise fill with an empty (x,y)
    if (yearMap.has(year)) {
      const { refereed, notrefereed } = yearMap.get(year);
      return {
        year,
        refereed,
        notrefereed,
      };
    }
    return { year, refereed: 0, notrefereed: 0 };
  });

  return { data: finalData, keys, indexBy: 'year' };
};

export const getHIndexGraphData = (counts: IBucket[], maxDataPoints: number): Datum[] => {
  // data: [{x, y}...]
  const data: Datum[] = [];
  let xCounter = 0;
  counts.some((item) => {
    xCounter += item.count;
    // one dot per paper (this way we'll only plot the top ranked X - fraction of results)
    while (xCounter > data.length && data.length < maxDataPoints) {
      data.push({ y: item.val, x: data.length + 1 });
    }
    if (data.length > maxDataPoints) {
      return true;
    }
    return false;
  });

  return data;
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
