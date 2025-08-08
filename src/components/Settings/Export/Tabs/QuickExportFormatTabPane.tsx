import { Box, Stack, Text } from '@chakra-ui/react';

import { UserDataSetterEvent } from '@/pages/user/settings/export';
import { Dispatch, useMemo } from 'react';
import { useSettings } from '@/lib/useSettings';
import { IDocsEntity } from '@/api/search/types';
import { useGetExportCitation } from '@/api/export/export';
import { Select } from '@/components/Select';
import { ExportFormatOption, useExportFormats } from '@/lib/useExportFormats';
import { ExportApiFormatKey } from '@/api/export/types';

export interface QuickExportFormatTabPaneProps {
  sampleBib: IDocsEntity['bibcode'];
  dispatch: Dispatch<UserDataSetterEvent>;
}

export const QuickExportFormatTabPane = ({ sampleBib, dispatch }: QuickExportFormatTabPaneProps) => {
  const { settings: userSettings } = useSettings({ suspense: false });

  const { formatOptions } = useExportFormats();

  const citationFormatOptions = formatOptions.filter((o) => o.type === 'HTML');

  // default export format changed
  const handleApplyDefaulCitationFormat = (format: ExportFormatOption) => {
    dispatch({ type: 'SET_DEFAULT_CITATION_FORMAT', payload: format.value });
  };

  const defaultCitationFormatOpt = useMemo(() => {
    const { defaultCitationFormat } = userSettings;

    return (
      citationFormatOptions.find((option) => option.id === defaultCitationFormat) ??
      citationFormatOptions.find((option) => option.id === ExportApiFormatKey.agu)
    );
  }, [userSettings, citationFormatOptions]);

  const { data } = useGetExportCitation({
    format: defaultCitationFormatOpt.id,
    bibcode: [sampleBib],
    maxauthor: [2000],
  });

  return (
    <Stack direction="column">
      <Select
        name="format"
        label="Citation Format"
        hideLabel
        id="citation-format-selector"
        options={citationFormatOptions}
        value={defaultCitationFormatOpt}
        onChange={handleApplyDefaulCitationFormat}
        stylesTheme="default"
      />
      <Text size="md" fontWeight="bold">
        Sample Format
      </Text>
      <Box fontWeight="medium" dangerouslySetInnerHTML={{ __html: data?.export }} />
    </Stack>
  );
};
