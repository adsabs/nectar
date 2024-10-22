import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';

export const getVaultBigQueryParams = (bibcodes: IDocsEntity['bibcode'][]): IADSApiSearchParams => ({
  q: '*:*',
  fq: ['{!bitset}'],
  sort: ['date desc'],
  bigquery: `bibcode\n${bibcodes.join('\n')}`,
});
