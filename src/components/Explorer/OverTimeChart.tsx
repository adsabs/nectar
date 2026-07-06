import { useCustomFacetSearch } from '@/api/search/search';
import { IADSApiSearchParams } from '@/api/search/types';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  MouseHandlerDataParam,
} from 'recharts';
import { parseTitleFromKey } from '../SearchFacet/helpers';
import { prop, sortBy } from 'ramda';
import { CustomInfoMessage } from '../Feedbacks';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { Box, Skeleton } from '@chakra-ui/react';
import { makeYearSearchLink } from './helpers';

const facetJsonDoctype = {
  year: {
    type: 'terms',
    field: 'year',
    limit: 100,
    mincount: 1,
    facet: { doctype: { type: 'terms', field: 'doctype_facet_hier', limit: 3000, mincount: 1, sort: 'index asc' } },
  },
};

const facetJsonYearRefereed = {
  year: {
    type: 'terms',
    field: 'year',
    limit: 100,
    mincount: 1,
    facet: { property: { type: 'terms', field: 'property', limit: 3000, mincount: 1, sort: 'index asc' } },
  },
};

const highlightDoctypes = [
  'Journal Article',
  'Abstract',
  'e-print',
  'Conference Paper',
  'Preprint',
  'Dataset',
  'Book Chapter',
];

const doctypeLegends = [
  { doctype: 'Journal Article', color: '#1f77b4' },
  { doctype: 'Abstract', color: '#7f7f7f' },
  { doctype: 'e-print', color: '#ff7f0e' },
  { doctype: 'Conference Paper', color: '#2ca02c' },
  { doctype: 'Preprint', color: '#d62728' },
  { doctype: 'Dataset', color: '#9467bd' },
  { doctype: 'Book Chapter', color: '#8c564b' },
  { doctype: 'Others', color: '#e377c2' },
];

const refereedLegends = [
  { doctype: 'refereed', color: '#1f77b4' },
  { doctype: 'notrefereed', color: '#ff7f0e' },
];

export const OverTimeChart = ({ type, query }: { type: 'doctype' | 'refereed'; query: IADSApiSearchParams }) => {
  const { sort, p, ...cleanParams } = query;
  const { data, isError, isLoading, error } = useCustomFacetSearch({
    ...cleanParams,
    rows: 0,
    facet: true,
    ['json.facet']: JSON.stringify(type === 'doctype' ? facetJsonDoctype : facetJsonYearRefereed),
  });

  // transform to format used by rechart
  // [{year, ...properties}]
  const transformedData = useMemo(() => {
    if (data && type === 'doctype') {
      const temp = data.year.buckets.map((yearBucket) => {
        return yearBucket.doctype.buckets.reduce(
          (acc, doctypeBucket) => {
            const doctype = parseTitleFromKey(doctypeBucket.val as string);
            const count = doctypeBucket.count;
            if (highlightDoctypes.includes(doctype)) {
              return { ...acc, [doctype]: count };
            } else {
              return { ...acc, Others: ((acc.Others as number) || 0) + count };
            }
          },
          { year: yearBucket.val } as Record<string, number | string>,
        );
      });

      return sortBy(prop('year'), temp);
    } else if (data && type === 'refereed') {
      const temp = data.year.buckets.map((yearBucket) => {
        return yearBucket.property.buckets.reduce(
          (acc, refereedBucket) => {
            const property = parseTitleFromKey(refereedBucket.val as string);
            const count = refereedBucket.count;
            return { ...acc, [property]: count };
          },
          { year: yearBucket.val },
        );
      });

      return sortBy(prop('year'), temp);
    }
  }, [data]);

  const handleClick = (state: MouseHandlerDataParam) => {
    if (typeof window !== 'undefined' && state.activeLabel) {
      const year = state.activeLabel;
      const url = makeYearSearchLink(query, year.toLocaleString());
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return <Skeleton w="full" height={300} />;
  } else if (isError) {
    return (
      <Box height={300} width="100%">
        <CustomInfoMessage
          status={'error'}
          alertTitle={'Error! Unable to show graph'}
          description={parseAPIError(error)}
        />
      </Box>
    );
  }

  return (
    <ResponsiveContainer height={300} width="100%">
      <AreaChart
        accessibilityLayer
        responsive
        barCategoryGap="10%"
        barGap={4}
        data={transformedData}
        height={400}
        layout="horizontal"
        margin={{
          bottom: 0,
          left: 0,
          right: 30,
          top: 10,
        }}
        stackOffset="none"
        syncMethod="index"
        throttleDelay="raf"
        throttledEvents={['mousemove', 'touchmove', 'pointermove', 'scroll', 'wheel']}
        width={500}
        onClick={handleClick}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <YAxis />
        <XAxis dataKey="year" domain={['auto', 'auto']} scale="time" type="number" />
        {type === 'doctype'
          ? doctypeLegends.map((dt, i) => (
              <Area
                key={`area-${i}`}
                dataKey={dt.doctype}
                fill={dt.color}
                stackId="1"
                stroke={dt.color}
                type="monotone"
              />
            ))
          : refereedLegends.map((r, i) => (
              <Area key={`area-${i}`} dataKey={r.doctype} fill={r.color} stackId="1" stroke={r.color} type="monotone" />
            ))}
        <Tooltip />
        <Legend />
      </AreaChart>
    </ResponsiveContainer>
  );
};
