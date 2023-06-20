import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';

export const isClaimedBySciX = (profile: IOrcidProfileEntry) => {
  return profile?.source?.indexOf('NASA Astrophysics Data System') !== -1;
};

export const isInSciX = (profile: IOrcidProfileEntry) => {
  return profile.status !== 'not in ADS';
};
