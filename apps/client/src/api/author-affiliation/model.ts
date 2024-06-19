import { IAuthorAffiliationPayload } from './types';

const defaultParams: IAuthorAffiliationPayload = {
  bibcode: [],
  maxauthor: [3],
  numyears: [3],
};

export const getAuthorAffiliationSearchParams = (
  params: Partial<IAuthorAffiliationPayload>,
): IAuthorAffiliationPayload => {
  return {
    ...defaultParams,
    ...params,
  };
};
