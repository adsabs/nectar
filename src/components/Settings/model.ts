import { IADSApiUserDataResponse, UserDataKeys } from '@api';

export const DEFAULT_USER_DATA: IADSApiUserDataResponse = {
  [UserDataKeys.HOMEPAGE]: 'Modern Form',
  [UserDataKeys.LINK_SERVER]: '',
  [UserDataKeys.CUSTOM_FORMATS]: [],
  [UserDataKeys.BIBTEXT_FORMAT]: '',
  [UserDataKeys.DEFAULT_DATABASE]: [
    { name: 'Physics', value: false },
    { name: 'Astronomy', value: false },
    { name: 'General', value: false },
  ],
  [UserDataKeys.BIBTEXT_MAX_AUTHORS]: '10',
  [UserDataKeys.LAST_MESSAGE]: '',
  [UserDataKeys.ABS_FORMAT]: '',
  [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: '200',
  [UserDataKeys.EXTERNAL_LINK_ACTION]: 'Auto',
  [UserDataKeys.ABS_MAX_AUTHORS]: '10',
  [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: 'Use AASTeX macros',
  [UserDataKeys.DEFAULT_EXPORT_FORMAT]: 'BibTeX',
  [UserDataKeys.DEFAULT_HIDE_SIDEBARS]: 'Show',
  [UserDataKeys.MIN_AUTHOR_RESULT]: '4',
  [UserDataKeys.ABS_AUTHOR_CUTOFF]: '200',
};
