import { isNilOrEmpty } from 'ramda-adjunct';
import { adjust, compose, map, range, repeat, transpose, without } from 'ramda';
import { IDocsEntity } from '@/api/search/types';

/**
 * Takes in a doc and tries to gather all author information into a data structure like below:
 * ```
 * [
 *    ['1', 'Zhang, Dali', 'INFN, Sezione di Pisa, I-56127 Pisa, Italy', '0000-0003-4311-5804'],
 *    ['2', 'Li, Xinqiao', '']
 * ]
 * ```
 * @param doc
 */
export const coalesceAuthorsFromDoc = (doc: IDocsEntity, includeAff?: boolean) => {
  const { author = [], aff = [], orcid_other = [], orcid_pub = [], orcid_user = [] } = doc;

  if (isNilOrEmpty(author)) {
    return [];
  }

  const len = author.length;

  return includeAff
    ? map(
        compose(
          // remove extra '-', essentially coalescing orcid value
          without(['-']),

          // replace affs with an empty string, so we don't wipe it out in the next step
          adjust(2, (v) => (v === '-' ? '' : v)),
        ),

        // stack each array
        transpose([
          map((v) => v.toLocaleString(), range(1, len + 1)),
          author,
          aff ?? repeat('', len),
          orcid_other,
          orcid_pub,
          orcid_user,
        ]),
      )
    : map(
        without(['-']),
        transpose([map((v) => v.toLocaleString(), range(1, len + 1)), author, orcid_other, orcid_pub, orcid_user]),
      );
};
