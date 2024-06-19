import { countOptions, exportTypes } from './models';

export interface IGroupedAuthorAffilationData {
  authorName: string;
  years: string[][];
  affiliations: string[];
  lastActiveDate: string[];
}

export interface IFormState {
  exportType: typeof exportTypes[number];
  authorCount: typeof countOptions[number];
  yearCount: typeof countOptions[number];
}

export type AuthorAffSelectionState = Record<
  string,
  {
    id: string;
    selected: boolean;
    affSelected: number[];
    dateSelected: string;
  }
>;
