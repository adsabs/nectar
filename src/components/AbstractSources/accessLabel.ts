import { Esources } from '@/api/search/types';

export type AccessLabel = {
  badge: string;
  colorScheme: string;
};

export const getAccessLabel = (open: boolean, rawType: keyof typeof Esources): AccessLabel | null => {
  if (rawType === Esources.INSTITUTION) {
    return null;
  }
  return open ? { badge: 'Open', colorScheme: 'green' } : { badge: 'Paid', colorScheme: 'yellow' };
};

/**
 * Derive a single access label for a group of links.
 * All links in a group share the same access level
 * (derived from the same PREFIX_OPENACCESS property).
 * Falls back to the first non-institution link.
 */
export const getGroupAccessLabel = (links: { open: boolean; rawType: keyof typeof Esources }[]): AccessLabel | null => {
  for (const link of links) {
    const label = getAccessLabel(link.open, link.rawType);
    if (label) {
      return label;
    }
  }
  return null;
};
