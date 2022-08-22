import { IADSApiSearchParams, IDocsEntity } from '@api';

export const getVaultBigQueryParams = (bibcodes: IDocsEntity['bibcode'][]): IADSApiSearchParams => ({
  q: '*:*',
  fq: ['{!bitset}'],
  sort: ['date desc'],
  bigquery: `bibcode\n${bibcodes.join('\n')}`,
});
