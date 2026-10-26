import { getSessionItem, removeSessionItem, SessionStorageKey, setSessionItem } from '@/lib/session/sessionStore';
import { isSolrSort } from '@/utils/common/guards';
import { CollectionChoice, IClassicFormState, LogicChoice, PropertyChoice } from './types';

const isLogicChoice = (value: unknown): value is LogicChoice =>
  value === 'and' || value === 'or' || value === 'boolean';

const isCollectionChoice = (value: unknown): value is CollectionChoice =>
  value === 'astronomy' || value === 'physics' || value === 'general' || value === 'earthscience';

const isPropertyChoice = (value: unknown): value is PropertyChoice =>
  value === 'refereed-only' || value === 'articles-only';

const isSolrSortArray = (value: unknown): value is IClassicFormState['sort'] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && isSolrSort(item));

const isClassicFormState = (value: unknown): value is IClassicFormState => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<IClassicFormState>;
  return (
    Array.isArray(candidate.limit) &&
    candidate.limit.every(isCollectionChoice) &&
    Array.isArray(candidate.property) &&
    candidate.property.every(isPropertyChoice) &&
    isSolrSortArray(candidate.sort) &&
    isLogicChoice(candidate.logic_author) &&
    isLogicChoice(candidate.logic_object) &&
    isLogicChoice(candidate.logic_title) &&
    isLogicChoice(candidate.logic_abstract_keywords) &&
    typeof candidate.author === 'string' &&
    typeof candidate.object === 'string' &&
    typeof candidate.pubdate_start === 'string' &&
    typeof candidate.pubdate_end === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.abstract_keywords === 'string' &&
    typeof candidate.bibstems === 'string'
  );
};

export const saveClassicFormSnapshot = (values: IClassicFormState): void => {
  setSessionItem(SessionStorageKey.ClassicFormSnapshot, values);
};

export const readClassicFormSnapshot = (): IClassicFormState | null => {
  const parsed = getSessionItem<unknown>(SessionStorageKey.ClassicFormSnapshot);

  if (!isClassicFormState(parsed)) {
    clearClassicFormSnapshot();
    return null;
  }

  return parsed;
};

export const clearClassicFormSnapshot = (): void => {
  removeSessionItem(SessionStorageKey.ClassicFormSnapshot);
};
