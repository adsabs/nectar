import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import { UseToastOptions } from '@chakra-ui/react';

export const isClaimedBySciX = (profile: IOrcidProfileEntry) => {
  return profile?.source?.indexOf('NASA Astrophysics Data System') !== -1;
};

export const isInSciX = (profile: IOrcidProfileEntry) => {
  return profile.status !== 'not in ADS';
};

export const TOAST_DEFAULTS: UseToastOptions = {
  duration: 5000,
  position: 'bottom-right',
};
