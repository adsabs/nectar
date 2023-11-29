import { CustomFormat, ExportApiFormatKey, IDocsEntity, useGetExportCitation, useGetUserSettings } from '@api';
import { Stack } from '@chakra-ui/react';
import { SampleTextArea } from '@components';
import { ExportFormat, exportFormats } from '@components/CitationExporter';
import { DEFAULT_USER_DATA, JournalFormatMap } from '@components/Settings/model';
import { UserDataSetterEvent } from '@pages/user/settings/export';
import { values } from 'ramda';
import { Dispatch, useMemo } from 'react';
import { ExportFormatSelect } from '../ExportFormatSelect';
import { CustomFormatSelect } from '../CustomFormatSelect';

export interface IGeneralTabPanelProps {
  sampleBib: IDocsEntity['bibcode'];
  dispatch: Dispatch<UserDataSetterEvent>;
  selectedOption: ExportFormat;
}

export const GeneralTabPanel = ({ sampleBib, selectedOption, dispatch }: IGeneralTabPanelProps) => {
  const { data: userSettingsData } = useGetUserSettings();

  const exportFormatOptions = values(exportFormats);

  const {
    defaultExportFormat = DEFAULT_USER_DATA.defaultExportFormat,
    customFormats = [],
    bibtexJournalFormat = DEFAULT_USER_DATA.bibtexJournalFormat,
    bibtexKeyFormat = DEFAULT_USER_DATA.bibtexKeyFormat,
    bibtexABSKeyFormat = DEFAULT_USER_DATA.bibtexABSKeyFormat,
    bibtexAuthorCutoff = DEFAULT_USER_DATA.bibtexAuthorCutoff,
    bibtexABSAuthorCutoff = DEFAULT_USER_DATA.bibtexABSAuthorCutoff,
    bibtexMaxAuthors = DEFAULT_USER_DATA.bibtexMaxAuthors,
  } = useMemo(() => ({ ...userSettingsData }), [userSettingsData]);

  // default export format changed
  const handleApplyDefaultExportFormat = (format: ExportFormat) => {
    dispatch({ type: 'SET_DEFAULT_EXPORT_FORMAT', payload: format.label });
  };

  const { defaultExportFormatOpt, customFormat, journalFormat, keyFormat, authorcutoff, maxauthor } = useMemo(() => {
    const defaultExportFormatOpt =
      exportFormatOptions.find((option) => option.label === defaultExportFormat) ??
      exportFormatOptions.find((option) => option.label === 'BibTeX');

    const customFormat = customFormats.length > 0 ? customFormats[0].code : '';
    const journalFormat = JournalFormatMap[bibtexJournalFormat];
    const keyFormat =
      defaultExportFormatOpt.id === exportFormats[ExportApiFormatKey.bibtex].id ? bibtexKeyFormat : bibtexABSKeyFormat;
    const authorcutoff =
      defaultExportFormatOpt.id === exportFormats[ExportApiFormatKey.bibtex].id
        ? bibtexAuthorCutoff
        : bibtexABSAuthorCutoff;
    const maxauthor =
      defaultExportFormatOpt.id === exportFormats[ExportApiFormatKey.bibtex].id ? bibtexMaxAuthors : bibtexAuthorCutoff;
    return { defaultExportFormatOpt, customFormat, journalFormat, keyFormat, authorcutoff, maxauthor };
  }, [
    defaultExportFormat,
    customFormats,
    bibtexJournalFormat,
    bibtexKeyFormat,
    bibtexABSKeyFormat,
    bibtexAuthorCutoff,
    bibtexABSAuthorCutoff,
    bibtexMaxAuthors,
  ]);

  const { data: sampleCitation } = useGetExportCitation({
    format: defaultExportFormatOpt.id,
    customFormat: customFormat,
    bibcode: [sampleBib],
    keyformat: [keyFormat],
    journalformat: [journalFormat],
    authorcutoff: [parseInt(authorcutoff)],
    maxauthor: [parseInt(maxauthor)],
  });

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
