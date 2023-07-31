import { curry } from 'ramda';
import { TypeaheadOption } from '@components/SearchBar/types';
import { matchSorter } from 'match-sorter';
import { typeaheadOptions } from '@components/SearchBar/models';

export const filterItems = curry((query: string, items: TypeaheadOption[]) => {
  if (/\s+$/.exec(query)) {
    return [];
  }

  const term = extractFinalTerm(query);

  return matchSorter(typeaheadOptions, term, { keys: ['match'], threshold: matchSorter.rankings.WORD_STARTS_WITH });
});

export const extractFinalTerm = (query: string) => {
  const fields = query.match(/(?:[^\s"]+|"[^"]*")+/g);
  return fields === null ? query : fields[fields.length - 1];
};
