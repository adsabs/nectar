import { adjust, compose, map, range, repeat, transpose, without } from 'ramda';
import { useMemo } from 'react';
import { IDocsEntity } from '@/api/search/types';

export interface IUseAuthorsProps {
  doc: IDocsEntity;
  includeAff?: boolean;
}

/**
 * Takes in a doc and returns a 2D array of authors that also includes (optionally) affiliations
 * It also coalesces orcid values from the 3 potential fields
 *
 * @example
 *
 * const getAuthors = useAuthors({ doc });
 *
 * // With affiliation
 * [
 *    ['Zhang, Dali', 'INFN, Sezione di Pisa, I-56127 Pisa, Italy', '0000-0003-4311-5804'],
 *    ['Li, Xinqiao', '']
 * ]
 *
 * // Without affiliation
 * [
 *    ['Zhang, Dali', '0000-0003-4311-5804'],
 *    ['Li, Xinqiao']
 * ]
 */
const buildAuthors = (doc: IDocsEntity, includeAff: boolean): string[][] => {
  if (!doc) {
    return [];
  }

  const { author, aff } = doc;
  const len = author?.length ?? 0;

  if (len === 0) {
    return [];
  }

  const orcid_other = doc.orcid_other ?? repeat('', len);
  const orcid_pub = doc.orcid_pub ?? repeat('', len);
  const orcid_user = doc.orcid_user ?? repeat('', len);

  const authorIndex = map((v) => v.toLocaleString(), range(1, len + 1));

  if (includeAff) {
    return map(
      compose(
        without(['-']),
        adjust(2, (v) => (v === '-' ? '' : v)),
      ),
      transpose([authorIndex, author, aff ?? repeat('', len), orcid_other, orcid_pub, orcid_user]),
    );
  }

  return map(without(['-']), transpose([authorIndex, author, orcid_other, orcid_pub, orcid_user]));
};

export const useGetAuthors = (props: IUseAuthorsProps): string[][] => {
  const { doc, includeAff = true } = props;
  return useMemo(() => (doc ? buildAuthors(doc, includeAff) : []), [doc, includeAff]);
};
