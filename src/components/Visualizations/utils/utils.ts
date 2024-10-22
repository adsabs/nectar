import { BarDatum } from '@nivo/bar';
import { Serie } from '@nivo/line';
import { FacetField, YearDatum } from '../types';
import { IADSApiSearchParams } from '@/api/search/types';

/**
 * From a line graph data, return an array of X ticks with the specified max number of ticks
 * @param data
 * @param maxTicks
 * @returns
 */
export const getLineGraphXTicks = (data: Serie[], maxTicks: number) => {
  let min = Number.MAX_SAFE_INTEGER;
  let max = 0;

  data.forEach((serie) => {
    serie.data.forEach((value) => {
      const x = typeof value.x === 'number' ? value.x : parseInt(value.x as string);
      if (x > max) {
        max = x;
      }
      if (x < min) {
        min = x;
      }
    });
  });

  const ticks: number[] = [];

  const nPerTick = Math.ceil((max - min + 1) / maxTicks);
  let y = min;
  while (y <= max) {
    if ((y - min) % nPerTick === 0) {
      ticks.push(y);
    }
    y += 1;
  }

  return ticks;
};

/**
 * From a YearDatum[] graph, create a new bar graph with the specified max number of x ticks by grouping the years
 * @param yearData
 * @param maxXTicks
 * @param startIndex
 * @param endIndex exclusive
 * @returns New bar graph with years grouped
 */
export const groupBarDatumByYear = (
  yearData: YearDatum[],
  maxXTicks: number,
  startIndex: number,
  endIndex: number,
): BarDatum[] => {
  const groupSize = Math.ceil((endIndex - startIndex) / maxXTicks);
  const res: BarDatum[] = [];
  let index = startIndex;
  while (index < endIndex) {
    const y = yearData[index].year;
    const gs = index + groupSize - 1 < endIndex ? groupSize : endIndex - index;
    const tmp = {
      year: `${y} - ${y + gs - 1}`,
      refereed: 0,
      notrefereed: 0,
    };
    for (let i = 0; i < gs; i++) {
      tmp.refereed += yearData[index + i].refereed;
      tmp.notrefereed += yearData[index + i].notrefereed;
    }
    res.push(tmp);
    index += gs;
  }
  return res;
};

export const getQueryWithCondition = (query: IADSApiSearchParams['q'], facetField: FacetField, condition: string) => {
  return (/^\(.*\)$/.test(query) ? query : `(${query})`) + ` AND ${facetField}:${condition}`;

  // TODO remove any old conditions, requires new way to represent q internally?
};

export const getYearGraphTicks = (data: YearDatum[], maxTicks: number) => {
  const ticks: number[] = [];

  data.forEach((d, index) => {
    if (index % maxTicks === 0) {
      ticks.push(d.year);
    }
  });

  return ticks;
};
