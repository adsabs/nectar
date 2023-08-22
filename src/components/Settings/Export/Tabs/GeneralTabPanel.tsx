import { CustomFormat, ExportApiFormatKey, IDocsEntity, useGetExportCitation } from '@api';
import { Stack } from '@chakra-ui/react';
import { SampleTextArea } from '@components';
import { ExportFormat, exportFormats } from '@components/CitationExporter';
import { JournalFormatMap } from '@components/Settings/model';
import { UserDataSetterEvent } from '@pages/user/settings/export';
import { values } from 'ramda';
import { Dispatch, useMemo } from 'react';
import { ExportFormatSelect } from '../ExportFormatSelect';
import { CustomFormatSelect } from '../CustomFormatSelect';
import { useSettings } from '@lib/useSettings';

export interface IGeneralTabPanelProps {
  sampleBib: IDocsEntity['bibcode'];
  dispatch: Dispatch<UserDataSetterEvent>;
  selectedOption: ExportFormat;
}

const exportFormatOptions = values(exportFormats);

export const GeneralTabPanel = ({ sampleBib, selectedOption, dispatch }: IGeneralTabPanelProps) => {
  const { settings: userSettings } = useSettings();

  // default export format changed
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

  const customFormats = userSettings.customFormats;

  // default custom format changed, reorder it to the top
  const handleChangeCustomDefault = (id: string) => {
    const cf = JSON.parse(JSON.stringify(customFormats)) as CustomFormat[];
    const fromIndex = cf.findIndex((f) => f.id === id);
    const fromFormat = cf[fromIndex];
    cf.splice(fromIndex, 1); // remove
    cf.splice(0, 0, fromFormat); // insert to top

    dispatch({
      type: 'SORT_CUSTOM_FORMAT',
      payload: cf,
    });
  };

  return (
    <Stack direction="column">
      <ExportFormatSelect selectedOption={selectedOption} onChange={handleApplyDefaultExportFormat} />
      {selectedOption.id === ExportApiFormatKey.custom && <CustomFormatSelect onChange={handleChangeCustomDefault} />}
      <SampleTextArea
        value={sampleCitation?.export ?? 'No custom format. Go to the Custom Formats tab to create a custom format.'}
        label="Default Export Sample"
      />
    </Stack>
  );
};
