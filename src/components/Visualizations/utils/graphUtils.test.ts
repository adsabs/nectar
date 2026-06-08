import { describe, expect, test } from 'vitest';

import {
  BasicStatsKey,
  CitationsHistogramKey,
  CitationsStatsKey,
  PapersHistogramKey,
  ReadsHistogramKey,
  TimeSeriesKey,
  type CitationsHistogramType,
  type PapersHistogramType,
  type ReadsHistogramType,
  type TimeSeriesType,
} from '@/api/metrics/types';
import type { IFacetCountsFields, IDocsEntity, IBucket } from '@/api/search/types';
import {
  getCitationTableData,
  getHIndexGraphData,
  getIndicesTableData,
  getPapersTableData,
  getReadsTableData,
  getResultsGraph,
  getYearsGraph,
  plotCitationsHist,
  plotPapersHist,
  plotReadsHist,
  plotTimeSeriesGraph,
} from './graphUtils';

const createCitationsHistogram = (overrides: Partial<CitationsHistogramType> = {}): CitationsHistogramType => ({
  [CitationsHistogramKey.RR]: { '2000': 3, '2001': 1 },
  [CitationsHistogramKey.RN]: { '2000': 4, '2001': 0 },
  [CitationsHistogramKey.NR]: { '2000': 0, '2001': 0 },
  [CitationsHistogramKey.NN]: { '2000': 2, '2001': 2 },
  [CitationsHistogramKey.RRN]: { '2000': 1.5, '2001': 0.5 },
  [CitationsHistogramKey.RNN]: { '2000': 0, '2001': 0 },
  [CitationsHistogramKey.NRN]: { '2000': 2.5, '2001': 0 },
  [CitationsHistogramKey.NNN]: { '2000': 0, '2001': 0 },
  ...overrides,
});

const createReadsHistogram = (overrides: Partial<ReadsHistogramType> = {}): ReadsHistogramType => ({
  [ReadsHistogramKey.RR]: { '2000': 3, '2001': 0 },
  [ReadsHistogramKey.AR]: { '2000': 5, '2001': 7 },
  [ReadsHistogramKey.RRN]: { '2000': 1.5, '2001': 0 },
  [ReadsHistogramKey.ARN]: { '2000': 2.5, '2001': 3 },
  ...overrides,
});

const createPapersHistogram = (overrides: Partial<PapersHistogramType> = {}): PapersHistogramType => ({
  [PapersHistogramKey.RP]: { '2000': 2, '2001': 1 },
  [PapersHistogramKey.AP]: { '2000': 4, '2001': 3 },
  [PapersHistogramKey.RPN]: { '2000': 0.5, '2001': 0.25 },
  [PapersHistogramKey.APN]: { '2000': 1.5, '2001': 0.25 },
  ...overrides,
});

describe('plotCitationsHist', () => {
  test('builds non-normalized chart data and skips zero-only series', () => {
    const histogram = createCitationsHistogram();

    expect(plotCitationsHist(false, histogram, false)).toEqual({
      data: [
        {
          year: '2000',
          'Ref. citations to ref. papers': 3,
          'Ref. citations to non ref. papers': 4,
          'Non ref. citations to non ref. papers': 2,
        },
        {
          year: '2001',
          'Ref. citations to ref. papers': 1,
          'Ref. citations to non ref. papers': 0,
          'Non ref. citations to non ref. papers': 2,
        },
      ],
      keys: [
        'Ref. citations to ref. papers',
        'Ref. citations to non ref. papers',
        'Non ref. citations to non ref. papers',
      ],
      indexBy: 'year',
    });
  });

  test('uses single-paper labels for normalized data', () => {
    const histogram = createCitationsHistogram();

    expect(plotCitationsHist(true, histogram, true)).toEqual({
      data: [
        {
          year: '2000',
          'Citations from ref. papers': 1.5,
          'Citations from non ref. papers': 2.5,
        },
        {
          year: '2001',
          'Citations from ref. papers': 0.5,
          'Citations from non ref. papers': 0,
        },
      ],
      keys: ['Citations from ref. papers', 'Citations from non ref. papers'],
      indexBy: 'year',
    });
  });

  test('preserves years from the first series and leaves missing values undefined', () => {
    const histogram = createCitationsHistogram({
      [CitationsHistogramKey.RN]: { '2000': 4 },
    });

    expect(plotCitationsHist(false, histogram, false)).toEqual({
      data: [
        {
          year: '2000',
          'Ref. citations to ref. papers': 3,
          'Ref. citations to non ref. papers': 4,
          'Non ref. citations to non ref. papers': 2,
        },
        {
          year: '2001',
          'Ref. citations to ref. papers': 1,
          'Ref. citations to non ref. papers': undefined,
          'Non ref. citations to non ref. papers': 2,
        },
      ],
      keys: [
        'Ref. citations to ref. papers',
        'Ref. citations to non ref. papers',
        'Non ref. citations to non ref. papers',
      ],
      indexBy: 'year',
    });
  });
});

describe('plotReadsHist and plotPapersHist', () => {
  test.each([
    {
      name: 'plotReadsHist non-normalized',
      run: () => plotReadsHist(false, createReadsHistogram()),
      expected: {
        data: [
          { year: '2000', Refereed: 3, 'Non-refereed': 2 },
          { year: '2001', Refereed: 0, 'Non-refereed': 7 },
        ],
        keys: ['Refereed', 'Non-refereed'],
        indexBy: 'year',
      },
    },
    {
      name: 'plotPapersHist normalized',
      run: () => plotPapersHist(true, createPapersHistogram()),
      expected: {
        data: [
          { year: '2000', Refereed: 0.5, 'Non-refereed': 1 },
          { year: '2001', Refereed: 0.25, 'Non-refereed': 0 },
        ],
        keys: ['Refereed', 'Non-refereed'],
        indexBy: 'year',
      },
    },
  ])('$name', ({ run, expected }) => {
    expect(run()).toEqual(expected);
  });

  test.each([
    {
      name: 'plotReadsHist omits the non-refereed key when all derived values are zero',
      run: () =>
        plotReadsHist(
          false,
          createReadsHistogram({
            [ReadsHistogramKey.RR]: { '2000': 2, '2001': 1 },
            [ReadsHistogramKey.AR]: { '2000': 2, '2001': 1 },
          }),
        ),
      expected: {
        data: [
          { year: '2000', Refereed: 2 },
          { year: '2001', Refereed: 1 },
        ],
        keys: ['Refereed'],
        indexBy: 'year',
      },
    },
    {
      name: 'plotPapersHist keeps values from all publications when the refereed year is missing',
      run: () =>
        plotPapersHist(
          false,
          createPapersHistogram({
            [PapersHistogramKey.RP]: { '2000': 2 },
            [PapersHistogramKey.AP]: { '2000': 4, '2001': 3 },
          }),
        ),
      expected: {
        data: [{ year: '2000', Refereed: 2, 'Non-refereed': 2 }],
        keys: ['Refereed', 'Non-refereed'],
        indexBy: 'year',
      },
    },
  ])('$name', ({ run, expected }) => {
    expect(run()).toEqual(expected);
  });
});

describe('plotTimeSeriesGraph', () => {
  test('builds series in implementation order and divides read10 values by 10', () => {
    const series: TimeSeriesType = {
      [TimeSeriesKey.H]: { '2000': 3, '2001': 4 },
      [TimeSeriesKey.G]: { '2000': 5 },
      [TimeSeriesKey.READ10]: { '2000': 40, '2001': 15 },
    };

    expect(plotTimeSeriesGraph(series)).toEqual({
      data: [
        {
          id: 'h-index',
          data: [
            { x: '2000', y: 3 },
            { x: '2001', y: 4 },
          ],
        },
        {
          id: 'g-index',
          data: [{ x: '2000', y: 5 }],
        },
        {
          id: 'read10-index',
          data: [
            { x: '2000', y: 4 },
            { x: '2001', y: 1.5 },
          ],
        },
      ],
    });
  });

  test('returns an empty data array when no series are defined', () => {
    expect(plotTimeSeriesGraph({})).toEqual({ data: [] });
  });
});

describe('table transformers', () => {
  test('getCitationTableData rounds decimal values to one place and preserves zeroes', () => {
    const input = {
      total: {
        [CitationsStatsKey.NCP]: 12.34,
        [CitationsStatsKey.TNC]: 20.04,
        [CitationsStatsKey.NSC]: 0,
        [CitationsStatsKey.ANC]: 1.04,
        [CitationsStatsKey.MNC]: 2,
        [CitationsStatsKey.NNC]: 3.99,
        [CitationsStatsKey.TNRC]: 4.44,
        [CitationsStatsKey.ANRC]: 5.05,
        [CitationsStatsKey.MNRC]: 6.66,
        [CitationsStatsKey.NNRC]: 7.01,
        'self-citations': [],
      },
      refereed: {
        [CitationsStatsKey.NCP]: 10.55,
        [CitationsStatsKey.TNC]: 11.01,
        [CitationsStatsKey.NSC]: 0,
        [CitationsStatsKey.ANC]: 1,
        [CitationsStatsKey.MNC]: 2.01,
        [CitationsStatsKey.NNC]: 3.44,
        [CitationsStatsKey.TNRC]: 4,
        [CitationsStatsKey.ANRC]: 5.94,
        [CitationsStatsKey.MNRC]: 6,
        [CitationsStatsKey.NNRC]: 7.49,
      },
    };

    expect(getCitationTableData(input)).toEqual({
      numberOfCitingPapers: [12.3, 10.6],
      totalCitations: [20, 11],
      numberOfSelfCitations: [0, 0],
      averageCitations: [1, 1],
      medianCitations: [2, 2],
      normalizedCitations: [4, 3.4],
      refereedCitations: [4.4, 4],
      averageRefereedCitations: [5, 5.9],
      medianRefereedCitations: [6.7, 6],
      normalizedRefereedCitations: [7, 7.5],
    });
  });

  test('getReadsTableData rounds values and uses the total median downloads value for both entries', () => {
    const input = {
      total: {
        [BasicStatsKey.TNR]: 100.04,
        [BasicStatsKey.ANR]: 3.49,
        [BasicStatsKey.MNR]: 2.01,
        [BasicStatsKey.TND]: 80.66,
        [BasicStatsKey.AND]: 4.44,
        [BasicStatsKey.MND]: 7.77,
        [BasicStatsKey.NP]: 0,
        [BasicStatsKey.NPC]: 0,
        [BasicStatsKey.RND]: 0,
        [BasicStatsKey.RNR]: 0,
      },
      refereed: {
        [BasicStatsKey.TNR]: 50.55,
        [BasicStatsKey.ANR]: 2.04,
        [BasicStatsKey.MNR]: 1.94,
        [BasicStatsKey.TND]: 40.01,
        [BasicStatsKey.AND]: 2.05,
        [BasicStatsKey.MND]: 9.99,
        [BasicStatsKey.NP]: 0,
        [BasicStatsKey.NPC]: 0,
        [BasicStatsKey.RND]: 0,
        [BasicStatsKey.RNR]: 0,
      },
    };

    expect(getReadsTableData(input)).toEqual({
      totalNumberOfReads: [100, 50.5],
      averageNumberOfReads: [3.5, 2],
      medianNumberOfReads: [2, 1.9],
      totalNumberOfDownloads: [80.7, 40],
      averageNumberOfDownloads: [4.4, 2],
      medianNumberOfDownloads: [7.8, 7.8],
    });
  });

  test('getPapersTableData and getIndicesTableData return rounded output shapes', () => {
    const papersInput = {
      total: {
        [BasicStatsKey.NP]: 10.09,
        [BasicStatsKey.NPC]: 4.44,
        [BasicStatsKey.AND]: 0,
        [BasicStatsKey.ANR]: 0,
        [BasicStatsKey.MND]: 0,
        [BasicStatsKey.MNR]: 0,
        [BasicStatsKey.RND]: 0,
        [BasicStatsKey.RNR]: 0,
        [BasicStatsKey.TND]: 0,
        [BasicStatsKey.TNR]: 0,
      },
      refereed: {
        [BasicStatsKey.NP]: 8.94,
        [BasicStatsKey.NPC]: 3,
        [BasicStatsKey.AND]: 0,
        [BasicStatsKey.ANR]: 0,
        [BasicStatsKey.MND]: 0,
        [BasicStatsKey.MNR]: 0,
        [BasicStatsKey.RND]: 0,
        [BasicStatsKey.RNR]: 0,
        [BasicStatsKey.TND]: 0,
        [BasicStatsKey.TNR]: 0,
      },
    };
    const indicesInput = {
      total: {
        [TimeSeriesKey.H]: 1.04,
        [TimeSeriesKey.M]: 2,
        [TimeSeriesKey.G]: 3.95,
        [TimeSeriesKey.I10]: undefined,
        [TimeSeriesKey.I100]: 0,
        [TimeSeriesKey.TORI]: 5.55,
        [TimeSeriesKey.RIQ]: 6.01,
        [TimeSeriesKey.READ10]: 7.77,
      },
      refereed: {
        [TimeSeriesKey.H]: 1.95,
        [TimeSeriesKey.M]: 2.04,
        [TimeSeriesKey.G]: 3,
        [TimeSeriesKey.I10]: 4.44,
        [TimeSeriesKey.I100]: undefined,
        [TimeSeriesKey.TORI]: 5,
        [TimeSeriesKey.RIQ]: 6.66,
        [TimeSeriesKey.READ10]: 0,
      },
    };

    expect(getPapersTableData(papersInput)).toEqual({
      totalNumberOfPapers: [10.1, 8.9],
      totalNormalizedPaperCount: [4.4, 3],
    });
    expect(getIndicesTableData(indicesInput)).toEqual({
      hIndex: [1, 1.9],
      mIndex: [2, 2],
      gIndex: [4, 3],
      i10Index: [undefined, 4.4],
      i100Index: [0, undefined],
      toriIndex: [5.5, 5],
      riqIndex: [6, 6.7],
      read10Index: [7.8, 0],
    });
  });
});

describe('getYearsGraph', () => {
  test('builds year buckets, fills gaps, and ignores unrelated property groups', () => {
    const input = {
      facet_queries: {},
      facet_fields: {} as IFacetCountsFields['facet_fields'],
      facet_ranges: {},
      facet_intervals: {},
      facet_heatmaps: {},
      facet_pivot: {
        'property,year': [
          {
            count: 2,
            field: 'property',
            value: 'refereed',
            pivot: [
              { field: 'year', value: '2000', count: 2 },
              { field: 'year', value: '2002', count: 3 },
            ],
          },
          {
            count: 1,
            field: 'property',
            value: 'notrefereed',
            pivot: [{ field: 'year', value: '2001', count: 4 }],
          },
          {
            count: 1,
            field: 'property',
            value: 'other',
            pivot: [{ field: 'year', value: '1999', count: 99 }],
          },
        ],
      },
    } as IFacetCountsFields;

    expect(getYearsGraph(input)).toEqual({
      data: [
        { year: 2000, refereed: 2, notrefereed: 0 },
        { year: 2001, refereed: 0, notrefereed: 4 },
        { year: 2002, refereed: 3, notrefereed: 0 },
      ],
      keys: ['refereed', 'notrefereed'],
      indexBy: 'year',
    });
  });
});

describe('getHIndexGraphData', () => {
  test('expands bucket counts into one point per paper and caps the result length', () => {
    const counts: IBucket[] = [
      { val: 9, count: 2 },
      { val: 5, count: 3 },
      { val: 1, count: 10 },
    ];

    expect(getHIndexGraphData(counts, 4)).toEqual([
      { x: 1, y: 9 },
      { x: 2, y: 9 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ]);
  });

  test.each([
    { name: 'empty counts', counts: [] as IBucket[], maxDataPoints: 5 },
    { name: 'zero max data points', counts: [{ val: 3, count: 2 }] as IBucket[], maxDataPoints: 0 },
  ])('returns an empty array for $name', ({ counts, maxDataPoints }) => {
    expect(getHIndexGraphData(counts, maxDataPoints)).toEqual([]);
  });
});

describe('getResultsGraph', () => {
  test('normalizes result nodes, defaults missing fields, and groups less common journals as other', () => {
    const docs = [
      { bibcode: '2024ApJ..0001A', pubdate: '2024-00-00', title: ['Alpha'], read_count: 5, citation_count: 7 },
      { bibcode: '2024ApJ..0002B', pubdate: '2024-02-00', title: ['Beta'] },
      { bibcode: '2024MNRAS003C', pubdate: '2024-03-15', title: ['Gamma'], read_count: 1, citation_count: 2 },
      { bibcode: '2024AJ...004D', pubdate: '2024-04-20', title: ['Delta'], read_count: 2, citation_count: 1 },
      { bibcode: '2024A&A..005E', pubdate: '2024-05-00', title: ['Epsilon'], read_count: 3, citation_count: 4 },
      { bibcode: '2024Nat..006F', pubdate: '2024-06-30', title: ['Zeta'], read_count: 4, citation_count: 5 },
      { bibcode: '2024Sci..007G', pubdate: '2024-07-00', title: ['Eta'], read_count: 6, citation_count: 8 },
      { bibcode: '2024PASP.008H', pubdate: '2024-08-12', title: ['Theta'], read_count: 7, citation_count: 9 },
    ] as IDocsEntity[];

    const result = getResultsGraph(docs);

    expect(result.groups).toEqual(['ApJ', 'PASP', 'Sci', 'Nat', 'A&A', 'other']);
    expect(result.data).toHaveLength(8);
    expect(result.data[0]).toMatchObject({
      bibcode: '2024ApJ..0001A',
      pubdate: '2024-01-01',
      title: 'Alpha',
      read_count: 5,
      citation_count: 7,
      year: 2024,
      pub: 'ApJ',
    });
    expect(result.data[0].date.toISOString()).toBe(new Date('2024-01-01').toISOString());
    expect(result.data[1]).toMatchObject({
      bibcode: '2024ApJ..0002B',
      pubdate: '2024-02-01',
      title: 'Beta',
      read_count: 0,
      citation_count: 0,
      pub: 'ApJ',
    });
    expect(result.data[2].pub).toBe('other');
    expect(result.data[3].pub).toBe('other');
    expect(result.data[6].pub).toBe('Sci');
  });

  test('returns no groups and rewrites all pubs to other when the top five journals are less than 25 percent of results', () => {
    const docs = Array.from({ length: 24 }, (_, index) => {
      const pub = `J${index.toString().padStart(4, '0')}`;
      return {
        bibcode: `2024${pub}X`,
        pubdate: '2024-01-15',
        title: [`Paper ${index + 1}`],
      };
    }) as IDocsEntity[];

    const result = getResultsGraph(docs);

    expect(result.groups).toEqual([]);
    expect(result.data.every((item) => item.pub === 'other')).toBe(true);
  });
});
