import { Box, FormControl, FormLabel } from '@chakra-ui/react';

import { DescriptionCollapse } from '@/components/CitationExporter';
import { exportFormatDescription } from '@/components/Settings';
import { Select } from '@/components/Select';
import { ExportFormatOption, useExportFormats } from '@/lib/useExportFormats';

export const ExportFormatSelect = ({
  selectedOption,
  onChange,
}: {
  selectedOption: ExportFormatOption;
  onChange: (format: ExportFormatOption) => void;
}) => {
  const { formatOptions } = useExportFormats();

  return (
    <DescriptionCollapse body={exportFormatDescription} label="Default Export Format">
      {({ btn, content }) => (
        <FormControl>
          <Select<ExportFormatOption>
            name="format"
            label={
              <Box mb="2">
                <FormLabel htmlFor="default-export-format-selector" fontSize={['sm', 'md']}>
                  {'Default Export Format'} {btn}
                </FormLabel>
                {content}
              </Box>
            }
            hideLabel={false}
            id="default-export-format-selector"
            options={formatOptions}
            value={selectedOption}
            onChange={onChange}
            stylesTheme="default"
          />
        </FormControl>
      )}
    </DescriptionCollapse>
  );
};
