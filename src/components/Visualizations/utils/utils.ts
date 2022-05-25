import { IADSApiSearchParams } from '@api';
import { Serie } from '@nivo/line';
import { FacetField } from '../types';

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

export const getQueryWithCondition = (query: IADSApiSearchParams['q'], facetField: FacetField, condition: string) => {
  return (/^\(.*\)$/.test(query) ? query : `(${query})`) + ` AND ${facetField}:${condition}`;

  // TODO remove any old conditions, requires new way to represent q internally?
};
