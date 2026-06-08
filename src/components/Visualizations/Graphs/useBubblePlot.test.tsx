import { renderHook } from '@testing-library/react';
import { useColorMode } from '@chakra-ui/react';
import type { IBubblePlot, IBubblePlotNodeData } from '../types';
import { useBubblePlot } from './useBubblePlot';
import { describe, expect, test } from 'vitest';
import { afterEach, vi } from 'vitest';

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');

  return {
    ...actual,
    useColorMode: vi.fn(),
  };
});

const mockedUseColorMode = vi.mocked(useColorMode);

const createNode = (overrides: Partial<IBubblePlotNodeData> = {}): IBubblePlotNodeData => ({
  bibcode: 'bibcode-1',
  pubdate: '2000-01-01',
  title: 'Paper',
  read_count: 10,
  citation_count: 5,
  date: new Date('2000-01-01T00:00:00.000Z'),
  year: 2000,
  pub: 'AAS',
  ...overrides,
});

const createGraph = (data: IBubblePlotNodeData[], groups?: string[]): IBubblePlot => ({
  data,
  groups,
});

afterEach(() => {
  vi.clearAllMocks();
  mockedUseColorMode.mockReturnValue({ colorMode: 'light' } as ReturnType<typeof useColorMode>);
});

describe('useBubblePlot', () => {
  test('builds linear x and y scales, year radius scale, and group colors from graph data', () => {
    mockedUseColorMode.mockReturnValue({ colorMode: 'light' } as ReturnType<typeof useColorMode>);

    const graph = createGraph(
      [
        createNode({
          bibcode: 'paper-1',
          citation_count: 5,
          read_count: 10,
          year: 2000,
          pub: 'AAS',
        }),
        createNode({
          bibcode: 'paper-2',
          citation_count: 15,
          read_count: 30,
          year: 2010,
          pub: 'PhRvL',
        }),
      ],
      ['AAS', 'PhRvL'],
    );

    const { result } = renderHook(() =>
      useBubblePlot({
        graph,
        xKey: 'citation_count',
        yKey: 'read_count',
        rKey: 'year',
        xScaleType: 'linear',
        yScaleType: 'linear',
        width: 400,
        height: 200,
      }),
    );

    expect(result.current).toMatchObject({
      textColor: '#000000',
    });
    expect(result.current.groupColor.domain()).toEqual(['AAS', 'PhRvL']);
    expect(result.current.groupColor('AAS')).toBe('hsla(282, 80%, 52%, 0.9)');
    expect(result.current.groupColor('PhRvL')).toBe('hsla(1, 80%, 51%, 0.9)');
    expect(result.current.xScaleFn.domain()).toEqual([5, 15]);
    expect(result.current.xScaleFn.range()).toEqual([0, 400]);
    expect(result.current.yScaleFn.domain()).toEqual([10, 30]);
    expect(result.current.yScaleFn.range()).toEqual([200, 0]);
    expect(result.current.rScaleFn.domain()).toEqual([2000, 2010]);
    expect(result.current.rScaleFn.range()).toEqual([2, 14]);
  });

  test('uses a time scale for date x values and dark mode text color', () => {
    mockedUseColorMode.mockReturnValue({ colorMode: 'dark' } as ReturnType<typeof useColorMode>);

    const firstDate = new Date('2001-01-01T00:00:00.000Z');
    const secondDate = new Date('2003-06-01T00:00:00.000Z');
    const graph = createGraph([
      createNode({ bibcode: 'paper-1', date: firstDate }),
      createNode({ bibcode: 'paper-2', date: secondDate }),
    ]);

    const { result } = renderHook(() =>
      useBubblePlot({
        graph,
        xKey: 'date',
        yKey: 'citation_count',
        rKey: 'citation_count',
        xScaleType: 'linear',
        yScaleType: 'linear',
        width: 600,
        height: 300,
      }),
    );

    expect(result.current.textColor).toBe('#ffffff');
    expect(result.current.xScaleFn.domain()).toEqual([firstDate, secondDate]);
    expect(result.current.xScaleFn.range()).toEqual([0, 600]);
    expect(result.current.rScaleFn.range()).toEqual([4, 26]);
  });

  test('normalizes zero minimum values to one for log scales', () => {
    mockedUseColorMode.mockReturnValue({ colorMode: 'light' } as ReturnType<typeof useColorMode>);

    const graph = createGraph([
      createNode({
        bibcode: 'paper-1',
        citation_count: 0,
        read_count: 0,
      }),
      createNode({
        bibcode: 'paper-2',
        citation_count: 100,
        read_count: 1000,
      }),
    ]);

    const { result } = renderHook(() =>
      useBubblePlot({
        graph,
        xKey: 'citation_count',
        yKey: 'read_count',
        rKey: 'citation_count',
        xScaleType: 'log',
        yScaleType: 'log',
        width: 500,
        height: 250,
      }),
    );

    expect(result.current.xScaleFn.domain()).toEqual([1, 100]);
    expect(result.current.yScaleFn.domain()).toEqual([1, 1000]);
    expect(result.current.xScaleFn.range()).toEqual([0, 500]);
    expect(result.current.yScaleFn.range()).toEqual([250, 0]);
  });

  test('returns usable scale objects for empty datasets', () => {
    mockedUseColorMode.mockReturnValue({ colorMode: 'light' } as ReturnType<typeof useColorMode>);

    const { result } = renderHook(() =>
      useBubblePlot({
        graph: createGraph([], []),
        xKey: 'citation_count',
        yKey: 'read_count',
        rKey: 'citation_count',
        xScaleType: 'linear',
        yScaleType: 'linear',
        width: 320,
        height: 180,
      }),
    );

    expect(result.current.groupColor.domain()).toEqual([]);
    expect(result.current.xScaleFn.range()).toEqual([0, 320]);
    expect(result.current.yScaleFn.range()).toEqual([180, 0]);
    expect(result.current.rScaleFn.range()).toEqual([4, 26]);
    expect(result.current.xScaleFn.domain().every((value) => Number.isNaN(value))).toBe(true);
    expect(result.current.yScaleFn.domain().every((value) => Number.isNaN(value))).toBe(true);
    expect(result.current.rScaleFn.domain().every((value) => Number.isNaN(value))).toBe(true);
  });

  test('ignores missing keyed values when computing extents', () => {
    mockedUseColorMode.mockReturnValue({ colorMode: 'light' } as ReturnType<typeof useColorMode>);

    const graph = createGraph([
      createNode({
        bibcode: 'paper-1',
        citation_count: undefined as unknown as number,
      }),
      createNode({
        bibcode: 'paper-2',
        citation_count: 42,
      }),
    ]);

    const { result } = renderHook(() =>
      useBubblePlot({
        graph,
        xKey: 'citation_count',
        yKey: 'read_count',
        rKey: 'citation_count',
        xScaleType: 'linear',
        yScaleType: 'linear',
        width: 400,
        height: 200,
      }),
    );

    expect(result.current.xScaleFn.domain()).toEqual([42, 42]);
    expect(result.current.rScaleFn.domain()).toEqual([42, 42]);
  });

  test('preserves single-item domains', () => {
    mockedUseColorMode.mockReturnValue({ colorMode: 'light' } as ReturnType<typeof useColorMode>);

    const graph = createGraph([createNode({ citation_count: 12, read_count: 7, year: 1999 })]);

    const { result } = renderHook(() =>
      useBubblePlot({
        graph,
        xKey: 'citation_count',
        yKey: 'read_count',
        rKey: 'year',
        xScaleType: 'linear',
        yScaleType: 'linear',
        width: 100,
        height: 50,
      }),
    );

    expect(result.current.xScaleFn.domain()).toEqual([12, 12]);
    expect(result.current.yScaleFn.domain()).toEqual([7, 7]);
    expect(result.current.rScaleFn.domain()).toEqual([1999, 1999]);
  });
});
