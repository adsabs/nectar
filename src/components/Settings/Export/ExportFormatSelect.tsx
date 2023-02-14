import { FormControl, FormLabel, Box } from '@chakra-ui/react';
import { DescriptionCollapse, ExportFormat, exportFormatDescription, exportFormats, Select } from '@components';
import { values } from 'ramda';

export const exportFormatOptions = values(exportFormats);

export const ExportFormatSelect = ({
  selectedOption,
  onChange,
}: {
  selectedOption: ExportFormat;
  onChange: (format: ExportFormat) => void;
}) => {
  return (
    <DescriptionCollapse body={exportFormatDescription} label="Default Export Format">
      {({ btn, content }) => (
        <FormControl>
          <Select<ExportFormat>
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
            options={exportFormatOptions}
            value={selectedOption}
            onChange={onChange}
            stylesTheme="default"
          />
        </FormControl>
      )}
    </DescriptionCollapse>
  );
};
