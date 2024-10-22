import { Button, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Tooltip, VStack } from '@chakra-ui/react';

import { JournalFormatSelect } from '@/components/CitationExporter';
import { JournalFormatMap } from '@/components/Settings/model';
import { UserDataSetterEvent } from '@/pages/user/settings/export';
import { Dispatch, useState } from 'react';
import { bibtexExportFormatDescription, journalNameHandlingDescription, maxAuthorDescription } from '../Description';
import { KeyFormatInputApply } from '../KeyFormatInputApply';
import { MaxAuthorCutoffField } from '../MaxAuthorCutoffField';
import { useSettings } from '@/lib/useSettings';
import { MaxAuthorField, SampleTextArea } from '@/components/Settings';
import { IDocsEntity } from '@/api/search/types';
import { useGetExportCitation } from '@/api/export/export';
import { ExportApiFormatKey, ExportApiJournalFormat } from '@/api/export/types';
import { JournalFormatName } from '@/api/user/types';

export type IBibtexTabPanelProps = {
  sampleBib: IDocsEntity['bibcode'];
  dispatch: Dispatch<UserDataSetterEvent>;
};

export const BibtexTabPanel = ({ sampleBib, dispatch }: IBibtexTabPanelProps) => {
  const { settings } = useSettings();
  const { bibtexKeyFormat, bibtexABSKeyFormat, bibtexJournalFormat } = settings;
  const bibtexAuthorCutoff = parseInt(settings.bibtexAuthorCutoff, 10);
  const bibtexABSAuthorCutoff = parseInt(settings.bibtexABSAuthorCutoff, 10);
  const bibtexMaxAuthors = parseInt(settings.bibtexMaxAuthors, 10);
  const bibtexABSMaxAuthors = parseInt(settings.bibtexABSMaxAuthors, 10);

  // If bibtex settings and bibtex Abs settings are the same
  // we can use basic view
  const canUseBasicMode =
    bibtexKeyFormat === bibtexABSKeyFormat &&
    bibtexAuthorCutoff === bibtexABSAuthorCutoff &&
    bibtexMaxAuthors === bibtexABSMaxAuthors &&
    bibtexAuthorCutoff === bibtexMaxAuthors; // basic settings cutoff and max authors are the same

  const [isBasicMode, setIsBasicMode] = useState(canUseBasicMode);

  const tabs = ['bibtex', 'bibtex abs'];
  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  const journalFormat = JournalFormatMap[bibtexJournalFormat];
  const keyFormat = isBasicMode || (!isBasicMode && selectedTab === 'bibtex') ? bibtexKeyFormat : bibtexABSKeyFormat;
  const authorcutoff =
    isBasicMode || (!isBasicMode && selectedTab === 'bibtex') ? bibtexAuthorCutoff : bibtexABSAuthorCutoff;
  const maxauthor = isBasicMode || (!isBasicMode && selectedTab === 'bibtex') ? bibtexMaxAuthors : bibtexABSMaxAuthors;

  const { data: sampleCitation } = useGetExportCitation(
    {
      format: selectedTab === 'bibtex' ? ExportApiFormatKey.bibtex : ExportApiFormatKey.bibtexabs,
      bibcode: [sampleBib],
      keyformat: [keyFormat],
      journalformat: [journalFormat],
      authorcutoff: [authorcutoff],
      maxauthor: [maxauthor],
    },
    { enabled: !!sampleBib },
  );

  const handleTabChange = (index: number) => {
    setSelectedTab(tabs[index]);
  };

  const handleChangeJournalFormat = (format: ExportApiJournalFormat) => {
    const formatName = Object.entries(JournalFormatMap).find(([, formatValue]) => formatValue === format)[0];
    dispatch({ type: 'SET_JOURNAL_NAME_HANDLING', payload: formatName as JournalFormatName });
  };

  const handleChangeAllBibtexExportKeyFormat = (format: string) => {
    dispatch({ type: 'SET_ALL_BIBTEX_KEY_FORMAT', payload: format });
  };

  const handleApplyAllBibtexMaxAuthors = (value: number) => {
    dispatch({ type: 'SET_ALL_BIBTEX_MAX_AUTHORS', payload: value.toString() });
  };

  const handleApplyBibtexExportKeyFormat = (format: string) => {
    dispatch({ type: 'SET_BIBTEX_KEY_FORMAT', payload: format });
  };

  // Bibtex max authors
  const handleApplyBibtexMaxAuthors = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_MAX_AUTHORS', payload: value.toString() });
  };

  // Bibtex author cutoff
  const handleApplyBibtexAuthorCutoff = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_AUTHORS_CUTOFF', payload: value.toString() });
  };

  // default export key format
  const handleApplyBibtexAbsExportKeyFormat = (format: string) => {
    dispatch({ type: 'SET_BIBTEX_ABS_KEY_FORMAT', payload: format });
  };

  // Bibtex max authors
  const handleApplyBibtexAbsMaxAuthors = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_ABS_MAX_AUTHORS', payload: value.toString() });
  };

  // Bibtex author cutoff
  const handleApplyBibtexAbsAuthorCutoff = (value: number) => {
    dispatch({ type: 'SET_BIBTEX_ABS_AUTHORS_CUTOFF', payload: value.toString() });
  };

  const handleToggleBasicMode = () => {
    if (!isBasicMode) {
      // Switching from advanced to basic
      // Reset Bibtex and Bibtex Abs to Bibtex settings
      dispatch({
        type: 'SET_ALL_BIBTEX_SETTINGS',
        payload: {
          keyFormat: bibtexKeyFormat,
          maxAuthors: bibtexMaxAuthors.toString(),
          cutoff: bibtexMaxAuthors.toString(), // set max and cutoff to the same in basic settings
        },
      });
    }
    setIsBasicMode((prev) => !prev);
  };

  return (
    <Stack direction="column" gap={5}>
      <JournalFormatSelect
        journalformat={[journalFormat]}
        onChange={handleChangeJournalFormat}
        label="TeX Journal Name Handling"
        description={journalNameHandlingDescription}
      />
      {isBasicMode ? (
        <VStack alignItems="end">
          <Tooltip label="You will get different settings for BibTeX and BibTeX Abs in Advanced Mode">
            <Button variant="link" onClick={handleToggleBasicMode}>
              swtich to advanced mode
            </Button>
          </Tooltip>
        </VStack>
      ) : (
        <VStack alignItems="end">
          <Tooltip label="This action with reset your advanced settings in BibTeX to basic settings">
            <Button variant="link" onClick={handleToggleBasicMode}>
              switch to basic mode
            </Button>
          </Tooltip>
        </VStack>
      )}
      {isBasicMode ? (
        <>
          <KeyFormatInputApply
            format={keyFormat}
            description={bibtexExportFormatDescription}
            label="Default Export Key Format"
            onApply={handleChangeAllBibtexExportKeyFormat}
          />
          <MaxAuthorField value={bibtexMaxAuthors} onChange={handleApplyAllBibtexMaxAuthors} />
        </>
      ) : (
        <>
          <Tabs variant="solid-rounded" onChange={handleTabChange}>
            <TabList>
              <Tab>BibTeX</Tab>
              <Tab>BibTeX Abs</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={{ base: 0, sm: '2' }}>
                <AdvancedTab
                  keyFormat={bibtexKeyFormat}
                  onApplyKeyFormat={handleApplyBibtexExportKeyFormat}
                  maxCutoff={bibtexAuthorCutoff}
                  onChangeMaxCutoff={handleApplyBibtexAuthorCutoff}
                  maxAuthor={bibtexMaxAuthors}
                  onChangeMaxAuthor={handleApplyBibtexMaxAuthors}
                />
              </TabPanel>
              <TabPanel px={{ base: 0, sm: '2' }}>
                <AdvancedTab
                  keyFormat={bibtexABSKeyFormat}
                  onApplyKeyFormat={handleApplyBibtexAbsExportKeyFormat}
                  maxCutoff={bibtexABSAuthorCutoff}
                  onChangeMaxCutoff={handleApplyBibtexAbsAuthorCutoff}
                  maxAuthor={bibtexABSMaxAuthors}
                  onChangeMaxAuthor={handleApplyBibtexAbsMaxAuthors}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </>
      )}

      <SampleTextArea value={sampleCitation?.export ?? ''} label="BibTeX Export Sample" />
    </Stack>
  );
};

interface IAdvancedTabProps {
  keyFormat: string;
  onApplyKeyFormat: (format: string) => void;
  maxCutoff: number;
  onChangeMaxCutoff: (value: number) => void;
  maxAuthor: number;
  onChangeMaxAuthor: (value: number) => void;
}
const AdvancedTab = ({
  keyFormat,
  onApplyKeyFormat,
  maxCutoff,
  onChangeMaxCutoff,
  maxAuthor,
  onChangeMaxAuthor,
}: IAdvancedTabProps) => {
  return (
    <Stack direction="column" gap={2}>
      <KeyFormatInputApply
        format={keyFormat}
        description={bibtexExportFormatDescription}
        label="Default Export Key Format"
        onApply={onApplyKeyFormat}
      />
      {maxAuthorDescription}
      <MaxAuthorCutoffField value={maxCutoff} onChange={onChangeMaxCutoff} />
      <MaxAuthorField value={maxAuthor} onChange={onChangeMaxAuthor} />
    </Stack>
  );
};
