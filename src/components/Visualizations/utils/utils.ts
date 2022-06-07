import { IADSApiSearchParams } from '@api';
import { BarDatum } from '@nivo/bar';
import { Serie } from '@nivo/line';
import { FacetField, YearDatum } from '../types';

export const getLineGraphYearTicks = (data: Serie[], maxTicks: number) => {
  if (data[0].data.length <= maxTicks) {
    return undefined;
  }
  const ticks: string[] = [];

  const nPerTick = Math.ceil(data[0].data.length / maxTicks);
  data[0].data.forEach(({ x }) => {
    if (+x % nPerTick === 0) {
      ticks.push(x as string);
    }
  });

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
