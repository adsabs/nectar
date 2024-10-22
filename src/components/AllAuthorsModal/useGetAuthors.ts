import { adjust, compose, map, range, repeat, transpose, without } from 'ramda';
import { useEffect, useState } from 'react';
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
export const useGetAuthors = (props: IUseAuthorsProps): string[][] => {
  const { doc, includeAff = true } = props;
  const [authors, setAuthors] = useState<string[][]>([]);

  useEffect(() => {
    if (doc) {
      const { author, aff, orcid_other = [], orcid_pub = [], orcid_user = [] } = doc;
      const len = author?.length ?? 0;

      // creates a table out of the arrays, then removes any '-', leaving sub-arrays with our author, aff, and orcid
      if (len > 0) {
        setAuthors(
          includeAff
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
                transpose([
                  map((v) => v.toLocaleString(), range(1, len + 1)),
                  author,
                  orcid_other,
                  orcid_pub,
                  orcid_user,
                ]),
              ),
        );
      }
    }
  }, [doc, includeAff]);

  return authors;
};
