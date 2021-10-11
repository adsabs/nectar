import { CitationsHistogramType, ReadsHistogramType } from '@api';
import { ICitationsTableData } from '@components/Metrics/Citations/Table';
import { IReadsTableData } from '@components/Metrics/Reads/Table';

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
    'normalized number of citations': number;
    'average number of refereed citations': number;
    'median number of citations': number;
    'median number of refereed citations': number;
    'number of citing papers': number;
    'average number of citations': number;
    'total number of refereed citations': number;
    'normalized number of refereed citations': number;
    'number of self-citations': number;
    'total number of citations': number;
  };
  total: {
    'number of self-citations': number;
    'average number of refereed citations': number;
    'median number of citations': number;
    'self-citations': string[];
    'number of citing papers': number;
    'average number of citations': number;
    'total number of refereed citations': number;
    'normalized number of refereed citations': number;
    'median number of refereed citations': number;
    'total number of citations': number;
    'normalized number of citations': number;
  };
}
export interface IReadTableInput {
  refereed: {
    'median number of downloads': number;
    'average number of reads': number;
    'normalized paper count': number;
    'recent number of reads': number;
    'number of papers': number;
    'recent number of downloads': number;
    'total number of reads': number;
    'median number of reads': number;
    'total number of downloads': number;
    'average number of downloads': number;
  };
  total: {
    'median number of downloads': number;
    'average number of reads': number;
    'normalized paper count': number;
    'recent number of reads': number;
    'number of papers': number;
    'recent number of downloads': number;
    'total number of reads': number;
    'median number of reads': number;
    'total number of downloads': number;
    'average number of downloads': number;
  };
}

export const plotCitationsHist = (normalize: boolean, citationsHist: CitationsHistogramType): IGraphData[] => {
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

export const plotReadsHist = (normalize: boolean, readsHist: ReadsHistogramType): IGraphData[] => {
  let data: { [key: string]: number | string }[];
  const returnArray: IPair[][] = [];

  if (!normalize) {
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

export const getCitationTableData = (citationData: ICitationTableInput): ICitationsTableData => {
  const data = {
    numberOfCitingPapers: [
      citationData.total['number of citing papers'],
      citationData.refereed['number of citing papers'],
    ],
    totalCitations: [
      citationData.total['total number of citations'],
      citationData.refereed['total number of citations'],
    ],
    numberOfSelfCitations: [
      citationData.total['number of self-citations'],
      citationData.refereed['number of self-citations'],
    ],
    averageCitations: [
      citationData.total['average number of citations'],
      citationData.refereed['average number of citations'],
    ],
    medianCitations: [
      citationData.total['median number of citations'],
      citationData.refereed['median number of citations'],
    ],
    normalizedCitations: [
      citationData.total['normalized number of citations'],
      citationData.refereed['normalized number of citations'],
    ],
    refereedCitations: [
      citationData.total['total number of refereed citations'],
      citationData.refereed['total number of refereed citations'],
    ],
    averageRefereedCitations: [
      citationData.total['average number of refereed citations'],
      citationData.refereed['average number of refereed citations'],
    ],
    medianRefereedCitations: [
      citationData.total['median number of refereed citations'],
      citationData.refereed['median number of refereed citations'],
    ],
    normalizedRefereedCitations: [
      citationData.total['normalized number of refereed citations'],
      citationData.refereed['normalized number of refereed citations'],
    ],
  };

  Object.entries(data).forEach(([name, arr]) => {
    data[name] = [limitPlaces(arr[0]), limitPlaces(arr[1])];
  });

  return data;
};

export const getReadsTableData = (generalData: IReadTableInput): IReadsTableData => {
  const data = {
    totalNumberOfReads: [generalData.total['total number of reads'], generalData.refereed['total number of reads']],
    averageNumberOfReads: [
      generalData.total['average number of reads'],
      generalData.refereed['average number of reads'],
    ],
    medianNumberOfReads: [generalData.total['median number of reads'], generalData.refereed['median number of reads']],
    totalNumberOfDownloads: [
      generalData.total['total number of downloads'],
      generalData.refereed['total number of downloads'],
    ],
    averageNumberOfDownloads: [
      generalData.total['average number of downloads'],
      generalData.refereed['average number of downloads'],
    ],
    medianNumberOfDownloads: [
      generalData.total['median number of downloads'],
      generalData.total['median number of downloads'],
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
