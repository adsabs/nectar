import { Box, Stack, Text } from '@chakra-ui/react';

import { JournalFormatMap } from '@/components/Settings/model';
import { UserDataSetterEvent } from '@/pages/user/settings/export';
import { Dispatch, useMemo } from 'react';
import { ExportFormatSelect } from '../ExportFormatSelect';
import { CustomFormatSelect } from '../CustomFormatSelect';
import { useSettings } from '@/lib/useSettings';
import { SampleTextArea } from '@/components/Settings';
import { IDocsEntity } from '@/api/search/types';
import { ExportApiFormatKey } from '@/api/export/types';
import { useGetExportCitation } from '@/api/export/export';
import { CustomFormat } from '@/api/user/types';
import { LoadingMessage } from '@/components/Feedbacks';
import { ExportFormatOption, useExportFormats } from '@/lib/useExportFormats';

export interface IGeneralTabPanelProps {
  sampleBib: IDocsEntity['bibcode'];
  dispatch: Dispatch<UserDataSetterEvent>;
  selectedOption: ExportFormatOption;
}

export const GeneralTabPanel = ({ sampleBib, selectedOption, dispatch }: IGeneralTabPanelProps) => {
  const { settings: userSettings } = useSettings({ suspense: false });

  const { getFormatOptionByLabel } = useExportFormats();

  // default export format changed
  const handleApplyDefaultExportFormat = (format: ExportFormatOption) => {
    dispatch({ type: 'SET_DEFAULT_EXPORT_FORMAT', payload: format.label });
  };

  const { defaultExportFormatOpt, customFormat, journalFormat, keyFormat, authorcutoff, maxauthor } = useMemo(() => {
    const {
      defaultExportFormat,
      customFormats,
      bibtexJournalFormat,
      bibtexKeyFormat,
      bibtexABSKeyFormat,
      bibtexAuthorCutoff,
      bibtexABSAuthorCutoff,
      bibtexMaxAuthors,
    } = userSettings;

    const defaultExportFormatOpt = getFormatOptionByLabel(defaultExportFormat) ?? getFormatOptionByLabel('BibTeX');

    const customFormat = customFormats.length > 0 ? customFormats[0].code : '';
    const journalFormat = JournalFormatMap[bibtexJournalFormat];
    const keyFormat = defaultExportFormatOpt.id === ExportApiFormatKey.bibtex ? bibtexKeyFormat : bibtexABSKeyFormat;
    const authorcutoff =
      defaultExportFormatOpt.id === ExportApiFormatKey.bibtex ? bibtexAuthorCutoff : bibtexABSAuthorCutoff;
    const maxauthor = defaultExportFormatOpt.id === ExportApiFormatKey.bibtex ? bibtexMaxAuthors : bibtexAuthorCutoff;
    return { defaultExportFormatOpt, customFormat, journalFormat, keyFormat, authorcutoff, maxauthor };
  }, [userSettings]);

  const { data: sampleCitation, isLoading } = useGetExportCitation({
    format: defaultExportFormatOpt.id,
    customFormat,
    bibcode: [sampleBib],
    keyformat: [keyFormat],
    journalformat: [journalFormat],
    authorcutoff: [parseInt(authorcutoff)],
    maxauthor: [parseInt(maxauthor)],
  });

  // default custom format changed, reorder it to the top
  const handleChangeCustomDefault = (id: string) => {
    const cf = JSON.parse(JSON.stringify(userSettings.customFormats)) as CustomFormat[];
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
      {isLoading ? (
        <LoadingMessage message="Loading" />
      ) : (
        <>
          {selectedOption.type === 'HTML' ? (
            <>
              <Text size="md" fontWeight="bold">
                Default Export Sample
              </Text>
              <Box fontWeight="medium" dangerouslySetInnerHTML={{ __html: sampleCitation?.export }} />
            </>
          ) : (
            <SampleTextArea
              value={
                sampleCitation?.export ?? 'No custom format. Go to the Custom Formats tab to create a custom format.'
              }
              label="Default Export Sample"
            />
          )}
        </>
      )}
    </Stack>
  );
};
