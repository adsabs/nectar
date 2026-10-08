import { IADSApiSearchResponse } from '@/api/search/types';

export interface SelectInitialDataParams {
  initialData: IADSApiSearchResponse | undefined;
  initialQueryHash: string | undefined;
  queryHash: string | undefined;
}

export const selectInitialData = ({
  initialData,
  initialQueryHash,
  queryHash,
}: SelectInitialDataParams): IADSApiSearchResponse | undefined => {
  if (!initialData || !initialQueryHash || !queryHash) {
    return undefined;
  }
  return initialQueryHash === queryHash ? initialData : undefined;
};
