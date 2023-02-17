import { ExportApiFormatKey, IDocsEntity, useGetExportCitation } from '@api';
import { Stack } from '@chakra-ui/react';
import { SampleTextArea } from '@components';
import { ExportFormat, exportFormats } from '@components/CitationExporter';
import { JournalFormatMap } from '@components/Settings/model';
import { UserDataSetterEvent } from '@pages/user/settings/export';
import { useStore } from '@store';
import { values } from 'ramda';
import { Dispatch, useMemo } from 'react';
import { ExportFormatSelect } from '../ExportFormatSelect';

export interface IGeneralTabPanelProps {
  sampleBib: IDocsEntity['bibcode'];
  dispatch: Dispatch<UserDataSetterEvent>;
  selectedOption: ExportFormat;
}

const exportFormatOptions = values(exportFormats);

export const GeneralTabPanel = ({ sampleBib, selectedOption, dispatch }: IGeneralTabPanelProps) => {
  // fetch sample citation
  const userSettings = useStore((state) => state.settings.user);

  // default export format
  const handleApplyDefaultExportFormat = (format: ExportFormat) => {
    dispatch({ type: 'SET_DEFAULT_EXPORT_FORMAT', payload: format.label });
  };

  const { defaultExportFormat, customFormat, journalFormat, keyFormat, authorcutoff, maxauthor } = useMemo(() => {
    const defaultExportFormat = exportFormatOptions.find((option) => option.label === userSettings.defaultExportFormat);
    const customFormat = userSettings.customFormats.length > 0 ? userSettings.customFormats[0].code : '';
    const journalFormat = JournalFormatMap[userSettings.bibtexJournalFormat];
    const keyFormat =
      defaultExportFormat.id === exportFormats[ExportApiFormatKey.bibtex].id
        ? userSettings.bibtexKeyFormat
        : userSettings.bibtexABSKeyFormat;
    const authorcutoff =
      defaultExportFormat.id === exportFormats[ExportApiFormatKey.bibtex].id
        ? userSettings.bibtexAuthorCutoff
        : userSettings.bibtexABSAuthorCutoff;
    const maxauthor =
      defaultExportFormat.id === exportFormats[ExportApiFormatKey.bibtex].id
        ? userSettings.bibtexMaxAuthors
        : userSettings.bibtexAuthorCutoff;
    return { defaultExportFormat, customFormat, journalFormat, keyFormat, authorcutoff, maxauthor };
  }, [userSettings]);

  const { data: sampleCitation } = useGetExportCitation({
    format: defaultExportFormat.id,
    customFormat: customFormat,
    bibcode: [sampleBib],
    keyformat: [keyFormat],
    journalformat: [journalFormat],
    authorcutoff: [parseInt(authorcutoff)],
    maxauthor: [parseInt(maxauthor)],
  });

  return (
    <Stack direction="column">
      <ExportFormatSelect selectedOption={selectedOption} onChange={handleApplyDefaultExportFormat} />
      <SampleTextArea value={sampleCitation?.export ?? ''} label="Default Export Sample" />
    </Stack>
  );
};
