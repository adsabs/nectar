import { IAuthorAffiliationItem } from '@api/author-affiliation/types';
import {
  append,
  equals,
  find,
  findIndex,
  groupWith,
  head,
  includes,
  lensPath,
  lensProp,
  mapObjIndexed,
  not,
  over,
  path,
  prop,
  propEq,
  set,
  uniq,
  view,
  without,
} from 'ramda';
import { isNilOrEmpty, notEqual } from 'ramda-adjunct';
import { EXPORT_DELIMETER, NONESYMBOL } from './models';
import { AuthorAffSelectionState, IGroupedAuthorAffilationData } from './types';

// accessors
const authorName = prop('authorName');
const name = path<string>(['affiliations', 'name']);
const years = path<string[]>(['affiliations', 'years']);
const lastActiveDate = path<string>(['affiliations', 'lastActiveDate']);

/**
 * @note
 * The data goes through 3 transforms
 *
 * 1. The raw data is recieved as an array of {IAuthorAffiliationItem}
 * 2. These items are grouped together by author name, with their affiliations, years, and lastActive date values merged
 * 3. The grouped data is then converted into an object keyed by the author name so that we can scope the rows to a particular entry
 */

/**
 * Affiliation data comes in as a dictionary with some potential duplicate entries.
 * this method will group entries by author name, combining the properties into arrays
 */
export const groupAffilationData = (affData: IAuthorAffiliationItem[]): IGroupedAuthorAffilationData[] => {
  if (isNilOrEmpty(affData)) {
    return [];
  }

  const groups = groupWith<IAuthorAffiliationItem>((a, b) => equals(authorName(a), authorName(b)), affData);

  const groupReducer = (acc: IGroupedAuthorAffilationData, item: IAuthorAffiliationItem) => ({
    ...acc,
    authorName: item.authorName,
    affiliations: [...acc.affiliations, name(item)],
    years: [...acc.years, [...years(item)]],
    lastActiveDate: uniq([...acc.lastActiveDate, lastActiveDate(item)]),
  });

  return groups.map((group) => {
    return group.reduce(groupReducer, {
      authorName: '',
      affiliations: [],
      years: [],
      lastActiveDate: [],
    } as IGroupedAuthorAffilationData);
  });
};

/**
 * For when generating the initial list, this will pick the first non-NONE entry
 * but if no no-NONE entries exist, it will pick the the first one
 */
const getSelectedAff = (affs: string[]) => {
  const idx = findIndex(notEqual(NONESYMBOL), affs);
  return idx < 0 ? 0 : idx;
};

/**
 * Generates the selection state for a set of grouped items
 */
export const createInitialSelection = (items: IGroupedAuthorAffilationData[]): AuthorAffSelectionState => {
  if (isNilOrEmpty(items)) {
    return {} as AuthorAffSelectionState;
  }

  return items.reduce((acc, item) => {
    const state = {
      id: item.authorName,
      // items are always selected initially
      selected: true,

      affSelected: [getSelectedAff(item.affiliations)],

      dateSelected: head(item.lastActiveDate),
    };

    return {
      ...acc,
      [item.authorName]: state,
    };
  }, {} as AuthorAffSelectionState);
};

// lenses
const selectedPath = (id: string) => lensPath([id, 'selected']);
const affPath = (id: string) => lensPath([id, 'affSelected']);
const datePath = (id: string) => lensPath([id, 'dateSelected']);

/**
 * Toggle the selected state of ALL items in the list
 */
export const toggleAll = (toggle: boolean, state: AuthorAffSelectionState): AuthorAffSelectionState =>
  mapObjIndexed(set(lensProp('selected'), toggle), state);

/**
 * Toggle the selected state of an item
 */
export const toggle = (id: string, state: AuthorAffSelectionState): AuthorAffSelectionState =>
  over<AuthorAffSelectionState, boolean>(selectedPath(id), not, state);

/**
 * Toggles an item's affiliation, this effectively removes or appends and index from a list
 * since the selected affs are mapped (i.e. [0, 1, 2] to [foo, bar, baz])
 */
export const toggleAff = (id: string, aff: number, state: AuthorAffSelectionState): AuthorAffSelectionState =>
  over<AuthorAffSelectionState, number[]>(
    affPath(id),
    (val) => (includes(aff, val) ? without([aff], val) : append(aff, val)),
    state,
  );

/**
 * Sets the lastActive date on a particular item
 */
export const selectDate = (id: string, date: string, state: AuthorAffSelectionState): AuthorAffSelectionState =>
  set<AuthorAffSelectionState, string>(datePath(id), date, state);

/**
 * Takes an author, aff, and date and returns a delimited string
 */
const affToString = (id: string, aff: string, date: string): string => [id, aff, date].join(EXPORT_DELIMETER);

/**
 * Return a grouped item by id (authorName)
 */
const findItemById = (id: string, items: IGroupedAuthorAffilationData[]) => find(propEq('authorName', id), items);

/**
 * Prepares the current items for export
 *
 * This needs to pull from both the current selection and the original list of items.
 *
 * This will return the items in a list of strings, in the format: `authorName|affiliation|lastActiveDate`
 *
 * @example
 * [
 *   'Abdulrahman, M. A.|Cairo University, Department of Astronomy|2023/02/01'
 * ]
 */
export const getFormattedSelection = (
  items: IGroupedAuthorAffilationData[],
  state: AuthorAffSelectionState,
): string[] => {
  // loop through the current selection
  return Object.values(state).reduce<string[]>((acc, value) => {
    if (value.selected) {
      // if selected, then find the item in the items list
      const item = findItemById(value.id, items);

      // run through all the affs, creating a string for each
      // spreads the affiliations out
      const subList = item.affiliations.reduce<string[]>(
        (subAcc, aff, idx) =>
          value.affSelected.includes(idx) ? [...subAcc, affToString(value.id, aff, value.dateSelected)] : subAcc,
        [],
      );

      // return the sublist
      return acc.concat(subList);
    }
    return acc;
  }, []);
};

/**
 * Returns the current selection state of an item
 */
export const getSelectionState = (id: string, state: AuthorAffSelectionState) => view(lensProp(id), state);

/**
 * Replaces all non-alpha characters with underscores
 */
export const normalizeAuthorName = (name: string) => name.replace(/[^A-z]/gi, '_').toLowerCase();
