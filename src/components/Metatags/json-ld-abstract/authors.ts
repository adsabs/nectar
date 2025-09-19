import { IDocsEntity } from '@/api/search/types';
import { pathOr } from 'ramda';
import { EXTERNAL_URLS } from '@/config';
import { Person } from 'schema-dts';
import { asArray } from './helpers';
import { logger } from '@/logger';

const getAuthors = pathOr<string[]>([], ['author']);
const getOrcids = pathOr<string[]>([], ['orcid_user']);

// 0000-0000-0000-0000 (last char digit or X). Case-insensitive for X.
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;

/**
 * Coerce inputs to arrays and map authors to schema.org Person entries.
 */
export const authorsTransform = (doc: Partial<IDocsEntity>): Person[] => {
  try {
    const authors = asArray<string>(getAuthors(doc));
    const orcids = asArray<string>(getOrcids(doc));

    return authors.map((rawName, idx) => {
      const name = String(rawName ?? '').trim();
      const raw = orcids[idx];
      const orcid = typeof raw === 'string' ? raw.trim() : '';

      const person: Person = { '@type': 'Person', name };

      if (orcid && orcid !== '-' && ORCID_RE.test(orcid)) {
        // Normalize trailing x -> X
        const normalized = orcid.replace(/x$/i, 'X');
        return {
          ...person,
          sameAs: [`${EXTERNAL_URLS.ORCID}/${normalized}`],
          identifier: {
            '@type': 'PropertyValue',
            propertyID: 'ORCID',
            value: normalized,
          },
        };
      }
      return person;
    });
  } catch (err) {
    logger.error({ err, doc }, 'authorsTransform failed');
    return [];
  }
};
