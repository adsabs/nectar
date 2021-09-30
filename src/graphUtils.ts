import { ICitationsHistogram, IReadsHistogram } from './api/lib/metrics/types';

export interface IGraphData {
  key: string;
  values: IPair[];
}

export interface IPair {
  x: string;
  y: number;
}

export const plotCitationsHist = (normalize: boolean, citationsHist: ICitationsHistogram): IGraphData[] => {
  const returnArray: IPair[][] = [];
  let data: { year: number }[];
  const c = citationsHist;

  if (!normalize) {
    data = [
      c['refereed to refereed'],
      c['refereed to nonrefereed'],
      c['nonrefereed to refereed'],
      c['nonrefereed to nonrefereed'],
    ];
  } else {
    data = [
      c['refereed to refereed normalized'],
      c['refereed to nonrefereed normalized'],
      c['nonrefereed to refereed normalized'],
      c['nonrefereed to nonrefereed normalized'],
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

export const plotReadsHist = (normalize: boolean, readsHist: IReadsHistogram): IGraphData[] => {
  let data: { [key: string]: number | string }[];
  const returnArray: IPair[][] = [];

  if (normalize) {
    data = [readsHist['refereed reads'], getNonRef(readsHist['refereed reads'], readsHist['all reads'])];
  } else {
    data = [
      readsHist['refereed reads normalized'],
      getNonRef(readsHist['refereed reads normalized'], readsHist['all reads normalized']),
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
