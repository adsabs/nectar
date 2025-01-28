import { APP_DEFAULTS } from '@/config';
import { DatabaseEnum, ExternalLinkAction, IADSApiUserDataResponse, JournalFormatName, UserDataKeys } from './types';

export const DEFAULT_USER_DATA: IADSApiUserDataResponse = {
  [UserDataKeys.HOMEPAGE]: 'Modern Form',
  [UserDataKeys.LINK_SERVER]: '',
  [UserDataKeys.CUSTOM_FORMATS]: [],
  [UserDataKeys.BIBTEX_FORMAT]: '',
  [UserDataKeys.DEFAULT_DATABASE]: [
    { name: DatabaseEnum.All, value: false },
    { name: DatabaseEnum.Physics, value: false },
    { name: DatabaseEnum.Astronomy, value: false },
    { name: DatabaseEnum.General, value: false },
    { name: DatabaseEnum.EarthScience, value: false },
  ],
  [UserDataKeys.BIBTEX_MAX_AUTHORS]: `${APP_DEFAULTS.BIBTEX_DEFAULT_MAX_AUTHOR}`,
  [UserDataKeys.LAST_MESSAGE]: '',
  [UserDataKeys.ABS_FORMAT]: '',
  [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: `${APP_DEFAULTS.BIBTEX_DEFAULT_AUTHOR_CUTOFF}`,
  [UserDataKeys.EXTERNAL_LINK_ACTION]: ExternalLinkAction.Auto,
  [UserDataKeys.ABS_MAX_AUTHORS]: `${APP_DEFAULTS.BIBTEX_ABS_DEFAULT_MAX_AUTHOR}`,
  [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: JournalFormatName.AASTeXMacros,
  [UserDataKeys.DEFAULT_EXPORT_FORMAT]: 'BibTeX',
  [UserDataKeys.DEFAULT_CITATION_FORMAT]: 'agu',
  [UserDataKeys.DEFAULT_HIDE_SIDEBARS]: 'Show',
  [UserDataKeys.MIN_AUTHOR_RESULT]: '4',
  [UserDataKeys.ABS_AUTHOR_CUTOFF]: `${APP_DEFAULTS.BIBTEX_DEFAULT_AUTHOR_CUTOFF}`,
  [UserDataKeys.PREFERRED_SEARCH_SORT]: `${APP_DEFAULTS.PREFERRED_SEARCH_SORT}`,
};
