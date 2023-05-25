import { IOrcidProfile } from '@api/orcid/types';

export const isClaimedBySciX = (profile: IOrcidProfile) => {
  return profile.source.indexOf('NASA Astrophysics Data System') !== -1;
};

export const isInSciX = (profile: IOrcidProfile) => {
  return profile.status !== 'not in ADS';
};
