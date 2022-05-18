import { IFacetCountsFields } from '@api';

/**
 *  data format
 * [
 *   {year: number, refereed: number, notrefereed: number}, ...
 * ]
 *
 * key: year
 */
export const useFacetYears = (data: IFacetCountsFields) => {
  if (data) {
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
  } else {
    return null;
  }
};
