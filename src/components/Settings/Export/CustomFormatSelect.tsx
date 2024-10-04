import { FormControl, FormLabel } from '@chakra-ui/react';

import { useSettings } from '@/lib/useSettings';
import { Select } from '@/components/Select';

export const CustomFormatSelect = ({ onChange }: { onChange: (id: string) => void }) => {
  const { settings } = useSettings({ cacheTime: 0 });
  const customFormats = settings.customFormats;

  // custom formats to options
  const customFormatOptions = customFormats
    .map((f) => ({
      id: f.id,
      label: f.name,
      value: f.id,
      code: f.code,
    }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));

  const defaultCustomFormat = customFormatOptions.find((f) => f.id === customFormats[0].id) ?? null;

  const handleSelectFormat = (option: typeof customFormatOptions[0]) => {
    onChange(option.id);
  };

  return (
    <>
      <FormControl>
        <FormLabel>Select Custom Format</FormLabel>
        <Select
          label="Select Custom Formats"
          id="setting-custom-format-select"
          options={customFormatOptions}
          stylesTheme="default"
          value={defaultCustomFormat}
          onChange={handleSelectFormat}
        />
      </FormControl>
    </>
  );
};
