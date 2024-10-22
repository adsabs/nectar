import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import { UseToastOptions } from '@chakra-ui/react';
import { IDocsEntity } from '@/api/search/types';

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
/**
 * Helper utility that retrieves the first entry of the identifier field
 * or the single string if no array, or picks the bibcode (if available)
 * @param doc
 */
export const reconcileDocIdentifier = (doc: IDocsEntity): string => {
  // check for bibcode
  if (Object.hasOwn(doc, 'bibcode')) {
    return doc.bibcode;
  }

  // check for alternate bibcode
  if (Object.hasOwn(doc, 'alternate_bibcode')) {
    if (Array.isArray(doc.alternate_bibcode) && typeof doc.alternate_bibcode[0] === 'string') {
      return doc.alternate_bibcode[0];
    } else if (typeof doc.alternate_bibcode === 'string') {
      return doc.alternate_bibcode;
    }
  }

  // check for identifier field
  if (Object.hasOwn(doc, 'identifier')) {
    if (Array.isArray(doc.identifier) && typeof doc.identifier[0] === 'string') {
      return doc.identifier[0];
    } else if (typeof doc.identifier === 'string') {
      return doc.identifier;
    }
  }

  return null;
};
export const asyncDelay = (delay = 1000) => new Promise((resolve) => setTimeout(resolve, delay));
