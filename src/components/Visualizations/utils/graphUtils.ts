import {
  IADSApiAuthorNetworkNode,
  IADSApiAuthorNetworkResponse,
  IADSApiPaperNetworkFullGraph,
  IADSApiPaperNetworkResponse,
  IADSApiPaperNetworkSummaryGraphNode,
  IADSApiWordCloudResponse,
  IBibcodeDict,
} from '@/api/vis/types';

import type { Datum, Serie } from '@nivo/line';
import * as d3 from 'd3';
import { decode } from 'he';
import {
  countBy,
  divide,
  flatten,
  intersection,
  keys,
  pluck,
  prop,
  range,
  reduce,
  reverse,
  sort,
  sortBy,
  toPairs,
  uniq,
  values,
} from 'ramda';
import {
  IBarGraph,
  IBubblePlot,
  IBubblePlotNodeData,
  ICitationsTableData,
  ICitationTableInput,
  IIndicesTableData,
  IIndicesTableInput,
  ILineGraph,
  IPapersTableData,
  IPaperTableInput,
  IReadsTableData,
  IReadTableInput,
  ISliderRange,
  YearDatum,
} from '../types';
import {
  IAuthorNetworkNodeDetails,
  IPaperNetworkLinkDetails,
  IPaperNetworkNodeDetails,
} from '@/components/Visualizations';
import {
  BasicStatsKey,
  CitationsHistogramKey,
  CitationsHistogramType,
  CitationsStatsKey,
  PapersHistogramKey,
  PapersHistogramType,
  ReadsHistogramKey,
  ReadsHistogramType,
  TimeSeriesKey,
  TimeSeriesType,
} from '@/api/metrics/types';
import { IBucket, IDocsEntity, IFacetCountsFields } from '@/api/search/types';

/************ metrics helpers ************/

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

/************ author network helpers ************/

/**
 * Create author network summary graph from author network response
 * Output: [ {x: year, y: paper count}]
 * */
export const getAuthorNetworkSummaryGraph = (response: IADSApiAuthorNetworkResponse): ILineGraph => {
  if (!response.data.root) {
    return { data: undefined, error: new Error('Cannot generate network') };
  }

  const data: Serie[] = [];

  // for each group
  response.data.root.children.forEach((group, index) => {
    if (index > 6) {
      return;
    }

    // all papers from the group
    const bibcodes = uniq(reduce((acc, author) => [...acc, ...author.papers], [] as string[], group.children));

    // years range
    const years = uniq(bibcodes.map((bibcode) => parseInt(bibcode.slice(0, 4))));
    const yearsRange = d3.extent(years);
    const allYears = range(yearsRange[0], yearsRange[1]); // fill in the years gap

    // prefill all years with 0 count values { year: count}
    const skeleton: { [year in string]: number } = {};
    allYears.forEach((year) => (skeleton[year.toString()] = 0));

    // into year and paper count array [ ... {year: count} ]
    const yearPaperCount = {
      ...skeleton,
      ...countBy((bibcode) => bibcode.slice(0, 4), bibcodes),
    };

    // convert to line graph data [ ... {x: year, y: count} ]
    const graphData = Object.entries(yearPaperCount).map(([year, count]) => ({
      x: year,
      y: count,
    }));

    data.push({ id: group.name as string, data: graphData });
  });

  return { data };
};

export const getAuthorNetworkNodeDetails = (
  node: IADSApiAuthorNetworkNode,
  bibcode_dict: IBibcodeDict,
): IAuthorNetworkNodeDetails => {
  // if selected an author node
  if (!('children' in node)) {
    const bibcodes = uniq(node.papers);

    // get author's papers details
    const papers = bibcodes.map((bibcode) => ({
      ...bibcode_dict[bibcode],
      bibcode,
      author: bibcode_dict[bibcode].authors,
      title: Array.isArray(bibcode_dict[bibcode].title)
        ? (bibcode_dict[bibcode].title as string[]).map((t) => decode(t))
        : [decode(bibcode_dict[bibcode].title as string)],
    }));

    // sort by citation count
    papers.sort((p1, p2) => {
      return p2.citation_count - p1.citation_count;
    });

    // most recent year
    const mostRecentYear = bibcodes
      .sort((b1, b2) => {
        return parseInt(b1.slice(0, 4)) - parseInt(b2.slice(0, 4));
      })
      [bibcodes.length - 1].slice(0, 4);

    return {
      name: node.name as string,
      type: 'author',
      papers,
      mostRecentYear,
    };
  }
  // if selected a group node
  else {
    // all bibcodes in this group, has duplicates
    const allBibcodes = node.children.reduce((prev, current) => [...prev, ...current.papers], [] as string[]);

    // bibcode: author count
    const authorCount = countBy((a) => a, allBibcodes);

    // all bibcodes w/o duplicates
    const bibcodes = Object.keys(authorCount);

    // get min and max authors
    const numAuthors = Object.values(authorCount).sort();
    const minNumAuthors = numAuthors[0];
    const maxNumAuthors = numAuthors[numAuthors.length - 1];

    // min max percent authors in the group
    const percentAuthors = Object.entries(authorCount)
      .map(([bibcode, aCount]) => aCount / bibcode_dict[bibcode].authors.length)
      .sort();
    const minPercentAuthors = percentAuthors[0];
    const maxPercentAuthors = percentAuthors[percentAuthors.length - 1];

    // min max citations
    const numCitations = bibcodes
      .map((bibcode) => bibcode_dict[bibcode].citation_count / bibcode_dict[bibcode].authors.length)
      .sort();
    const minNumCitations = numCitations[0];
    const maxNumCitations = numCitations[numCitations.length - 1];

    // most recent year
    const mostRecentYear = bibcodes
      .sort((b1, b2) => {
        return parseInt(b1.slice(0, 4)) - parseInt(b2.slice(0, 4));
      })
      [bibcodes.length - 1].slice(0, 4);

    let papers = bibcodes.map((bibcode) => ({
      ...bibcode_dict[bibcode],
      bibcode,
      author: bibcode_dict[bibcode].authors,
      title: Array.isArray(bibcode_dict[bibcode].title)
        ? (bibcode_dict[bibcode].title as string[]).map((t) => decode(t))
        : [decode(bibcode_dict[bibcode].title as string)],
      groupAuthorCount: authorCount[bibcode],
    }));

    // sort paper
    // from https://github.com/adsabs/bumblebee/blob/752b9146a404de2cfefebf55cb0cc983907f7519/src/js/widgets/network_vis/network_widget.js#L701
    papers = reverse(
      sortBy(({ bibcode }) => {
        return (
          (((((authorCount[bibcode] - minNumAuthors) / (maxNumAuthors - minNumAuthors)) *
            (authorCount[bibcode] / bibcode_dict[bibcode].authors.length - minPercentAuthors)) /
            (maxPercentAuthors - minPercentAuthors)) *
            (bibcode_dict[bibcode].citation_count / bibcode_dict[bibcode].authors.length - minNumCitations)) /
          (maxNumCitations - minNumCitations)
        );
      }, papers),
    );

    return {
      name: `Group ${node.name as string}`,
      type: 'group',
      papers,
      mostRecentYear,
    };
  }
};

/************ paper network helpers ************/

/**
 * Create paper network summary graph from paper network data
 * */
export const getPaperNetworkSummaryGraph = (response: IADSApiPaperNetworkResponse): ILineGraph => {
  const summaryGraph = response.data.summaryGraph;
  const fullGraph = response.data.fullGraph;
  const data: Serie[] = [];
  const nameMap = new Map<number, string[]>();

  /* id is how you tie an entry in the summary graph with an entry in the full graph */

  const ids = pluck('id', summaryGraph.nodes);
  const names = pluck('node_name', summaryGraph.nodes);

  ids.forEach((id, index) => {
    const filteredNodes = fullGraph.nodes.filter((n) => n.group === id);
    nameMap.set(names[index], pluck('node_name', filteredNodes));
  });

  nameMap.forEach((nodeNames, groupName) => {
    if (groupName > 6) {
      return;
    }

    const bibcodes = uniq(nodeNames);

    // years
    const years = uniq(bibcodes.map((bibcode) => parseInt(bibcode.slice(0, 4))));
    const yearsRange = d3.extent(years);
    const allYears = range(yearsRange[0], yearsRange[1]); // fill in the years gap

    // prefill all years with 0 count values
    const skeleton: { [key in string]: number } = {};
    allYears.forEach((year) => (skeleton[year.toString()] = 0));

    // all papers in this group into year and paper count [ ... {year: count} ]
    const yearPaperCount = {
      ...skeleton,
      ...countBy((bibcode) => bibcode.slice(0, 4), bibcodes),
    };

    // convert graph data to [ ... {x: year, y: count} ]
    const graphData = Object.entries(yearPaperCount).map(([year, count]) => ({
      x: year,
      y: count,
    }));

    data.push({ id: groupName, data: graphData });
  });

  data.sort((a, b) => (a.id as number) - (b.id as number));

  return { data };
};

export const getPaperNetworkNodeDetails = (
  node: IADSApiPaperNetworkSummaryGraphNode,
  fullGraph: IADSApiPaperNetworkFullGraph,
): IPaperNetworkNodeDetails => {
  // make a copy
  const titleWords = Object.keys(node.node_label);

  const filteredNodes = fullGraph.nodes.filter((n) => n.group === node.id);
  const groupBibs = pluck('node_name', filteredNodes);

  const topCommonReferences = Object.entries(node.top_common_references)
    .map(([k, v]) => ({
      bibcode: k,
      percent: (v * 100).toFixed(0),
      inGroup: groupBibs.findIndex((b) => b === k) !== -1,
    }))
    .sort((a, b) => parseInt(b.percent) - parseInt(a.percent));

  const allPapers = sortBy(prop('citation_count'), filteredNodes).reverse();
  const papers = allPapers.map((p) => ({
    bibcode: p.node_name,
    title: [p.title],
    citation_count: p.citation_count,
    author: [p.first_author],
  }));

  return { ...node, titleWords, papers, topCommonReferences };
};

const getPaperNetworkLinks = (id: number, fullGraph: IADSApiPaperNetworkFullGraph) => {
  const indexes: number[] = [];
  const links: IADSApiPaperNetworkFullGraph['links'] = [];

  fullGraph.nodes.forEach((n, i) => {
    if (n.group === id) {
      indexes.push(i);
    }
  });
  fullGraph.links.forEach((l) => {
    if (indexes.indexOf(l.source) !== -1 || indexes.indexOf(l.target) !== -1) {
      links.push(l);
    }
  });
  return links;
};

// get link details
export const getPaperNetworkLinkDetails = (
  source: IADSApiPaperNetworkSummaryGraphNode,
  sourceColor: string,
  target: IADSApiPaperNetworkSummaryGraphNode,
  targetColor: string,
  fullGraph: IADSApiPaperNetworkFullGraph,
): IPaperNetworkLinkDetails => {
  // find references in common

  const links1 = getPaperNetworkLinks(source.id, fullGraph);
  const links2 = getPaperNetworkLinks(target.id, fullGraph);

  const allReferences1 = flatten(pluck('overlap', links1));
  const allReferences2 = flatten(pluck('overlap', links2));

  // shared references
  const references: IPaperNetworkLinkDetails['papers'] = [];
  intersection(allReferences1, allReferences2).forEach((b) => {
    const percent1 = allReferences1.filter((b1) => b1 === b).length / allReferences1.length;
    const percent2 = allReferences2.filter((b1) => b1 === b).length / allReferences2.length;
    references.push({
      bibcode: b,
      percent1: percent1 * 100,
      percent2: percent2 * 100,
    });
  });

  references.sort((a, b) => b.percent1 * b.percent2 - a.percent1 * a.percent2);

  return {
    groupOne: { name: `Group ${source.node_name}`, color: sourceColor },
    groupTwo: { name: `Group ${target.node_name}`, color: targetColor },
    papers: references,
  };
};

/************ concept cloud helpers ************/

// see https://github.com/adsabs/bumblebee/blob/826c1d8893b4ca236dba42a330c1f066f65f45cb/src/js/widgets/wordcloud/widget.js#L357
export const buildWCDict = (
  dict: IADSApiWordCloudResponse,
  sliderRange: ISliderRange,
  currentSliderVal: number,
  colorRange: string[],
) => {
  const numWords = keys(dict).length;

  const meanTF =
    values(dict)
      .map((x) => x.total_occurrences)
      .reduce((acc, c) => acc + c, 0) / numWords;

  const meanIDF =
    values(dict)
      .map((x) => (x.idf ? x.idf : 0))
      .reduce((acc, c) => acc + c, 0) / numWords;

  // [ [word, val], ... ]
  let wordDict: [string, number][] = Object.entries(dict).map(([word, val]) => {
    const freq = val.total_occurrences / meanTF;
    const idf = val.idf / meanIDF;

    const modifiedVal = sliderRange[currentSliderVal][0] * idf + sliderRange[currentSliderVal][1] * freq;

    // some stuff might be NaN, so do || 0
    return [word, modifiedVal || 0];
  });

  // sort to get 50 top candidates
  wordDict = wordDict.sort((a, b) => a[1] - b[1]).slice(-50);

  const min = wordDict[0][1];
  const max = wordDict[wordDict.length - 1][1];

  const pixelScale = d3.scaleLog().domain([min, max]).range([30, 70]);
  const wordList = wordDict.map(([word, value]) => ({
    text: word,
    size: pixelScale(value),
    selected: false,
    origSize: value,
  }));

  const fill = d3.scaleLog<string>().domain([min, max]);
  fill
    .domain([0, 0.25, 0.5, 0.75, 1].map((v) => fill.invert(v)))
    .range(colorRange)
    .clamp(true);

  return { wordList, fill };
};

/************ results graph helpers ************/

export const getResultsGraph = (docs: IDocsEntity[]): IBubblePlot => {
  const nodes = docs.map((d) => {
    const node: IBubblePlotNodeData = {
      bibcode: d.bibcode,
      pubdate: d.pubdate.replace(/(\D)00/g, (_m, p1) => `${p1 as string}01`), // turn 00s into 01s (ok maybe this is not the ideal solution)
      date: new Date(),
      title: d.title ? d.title[0] : '',
      read_count: d.read_count ?? 0,
      citation_count: d.citation_count ?? 0,
      year: parseInt(d.bibcode.slice(0, 4)),
      pub: d.bibcode.slice(4, 9).replace(/\./g, ''),
    };
    node.date = new Date(node.pubdate);
    return node;
  });

  // check if there are enough important journals to highlight circles
  // [...[pub, count]]
  const pubs = reverse(sort((p1, p2) => p1[1] - p2[1], toPairs(countBy((n) => n.pub, nodes))));

  // top pub counts
  const topPubsCount = pubs.slice(0, 5).reduce((acc, pair) => acc + pair[1], 0);

  const journalNames = topPubsCount / nodes.length >= 0.25 ? pubs.map((pair) => pair[0]).slice(0, 5) : [];
  if (journalNames.length > 0 && topPubsCount / nodes.length < 1) {
    journalNames.push('other');
  }

  // update pub name to others
  nodes.forEach((n) => (n.pub = journalNames.includes(n.pub) ? n.pub : 'other'));

  return { data: nodes, groups: journalNames };
};
