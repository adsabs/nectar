import type { CustomFormat, JournalFormatName } from '@/api/user/types';

export type UserDataSetterEvent =
  | { type: 'SET_DEFAULT_EXPORT_FORMAT'; payload: string }
  | { type: 'SET_DEFAULT_CITATION_FORMAT'; payload: string }
  | { type: 'ADD_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; name: string; code: string } }
  | { type: 'EDIT_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; id: string; name: string; code: string } }
  | { type: 'DELETE_CUSTOM_FORMAT'; payload: { currentFormats: CustomFormat[]; id: string } }
  | { type: 'SORT_CUSTOM_FORMAT'; payload: CustomFormat[] }
  | { type: 'SET_ALL_BIBTEX_KEY_FORMAT'; payload: string }
  | { type: 'SET_ALL_BIBTEX_MAX_AUTHORS'; payload: string }
  | { type: 'SET_ALL_BIBTEX_SETTINGS'; payload: { keyFormat: string; maxAuthors: string; cutoff: string } }
  | { type: 'SET_BIBTEX_KEY_FORMAT'; payload: string }
  | { type: 'SET_BIBTEX_MAX_AUTHORS'; payload: string }
  | { type: 'SET_BIBTEX_AUTHORS_CUTOFF'; payload: string }
  | { type: 'SET_BIBTEX_ABS_KEY_FORMAT'; payload: string }
  | { type: 'SET_BIBTEX_ABS_MAX_AUTHORS'; payload: string }
  | { type: 'SET_BIBTEX_ABS_AUTHORS_CUTOFF'; payload: string }
  | { type: 'SET_JOURNAL_NAME_HANDLING'; payload: JournalFormatName }
  | { type: 'CLEAR' };
