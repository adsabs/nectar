import { IADSApiSearchParams } from '@api/search';
import { IADSApiVisParams } from './types';

export const getAuthorNetworkParams = ({ q, sort, rows }: IADSApiSearchParams): IADSApiVisParams => {
  const query = JSON.stringify({ q: [`${q}`], sort: [`${sort.join(',')}`], rows: [`${rows}`] });
  return { query: [query] };
};

export const getPaperNetworkParams = ({ q, sort, rows }: IADSApiSearchParams): IADSApiVisParams => {
  const query = JSON.stringify({ q: [`${q}`], sort: [`${sort.join(',')}`], rows: [`${rows}`] });
  return { query: [query] };
};
