import { ExportApiFormatKey, IExportApiParams } from '@/api/export/types';
import { IADSApiUserDataResponse } from '@/api/user/types';
import { JournalFormatMap } from '@/components/Settings/model';
import { purifyString } from '@/utils/common/formatters';

/**
 * Builds bibtex-only export params (keyformat, journalformat, authorcutoff,
 * maxauthor) from user settings. Returns {} for non-bibtex formats.
 */
export const getBibtexExportParams = (
  settings: IADSApiUserDataResponse,
  format: string,
): Pick<IExportApiParams, 'keyformat' | 'journalformat' | 'authorcutoff' | 'maxauthor'> => {
  if (format !== ExportApiFormatKey.bibtex && format !== ExportApiFormatKey.bibtexabs) {
    return {};
  }

  const isAbs = format === ExportApiFormatKey.bibtexabs;

  return {
    keyformat: [purifyString(isAbs ? settings.bibtexABSKeyFormat : settings.bibtexKeyFormat)],
    journalformat: [JournalFormatMap[settings.bibtexJournalFormat]],
    authorcutoff: [parseInt(isAbs ? settings.bibtexABSAuthorCutoff : settings.bibtexAuthorCutoff, 10)],
    maxauthor: [parseInt(isAbs ? settings.bibtexABSMaxAuthors : settings.bibtexMaxAuthors, 10)],
  };
};
