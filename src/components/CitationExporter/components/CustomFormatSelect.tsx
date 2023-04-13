import { Dispatch, useEffect, useState } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { useStore } from '@store';
import { Button, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { Select } from '@components/Select';
import { ChangeEvent } from 'react';

export interface ICustomFormatSelectProps {
  dispatch: Dispatch<CitationExporterEvent>;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CustomFormatSelect = ({ dispatch }: ICustomFormatSelectProps) => {
  const customFormats = useStore((store) => store.settings.user?.customFormats ?? []);

  // custom formats to options
  const customFormatOptions = customFormats
    .map((f) => ({
      id: f.id,
      label: f.name,
      value: f.id,
      code: f.code,
    }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));
  customFormatOptions.splice(0, 0, { id: 'new', label: 'Enter New Format', value: 'new', code: '%1H:%Y:%q' });

  // init to user's default
  const defaultCustomFormat =
    customFormatOptions.length === 1
      ? customFormatOptions[0]
      : customFormatOptions.find((o) => o.id === customFormats[0].id);
  const [selectedFormatOption, setSelectedFormatOption] = useState(defaultCustomFormat);

  const [formatCode, setFormatCode] = useState(selectedFormatOption.code);

  // initial fetch
  useEffect(() => {
    if (selectedFormatOption.id !== 'new' || (selectedFormatOption.id === 'new' && formatCode !== '')) {
      dispatch({ type: 'SET_CUSTOM_FORMAT', payload: selectedFormatOption.code });
      dispatch({ type: 'SUBMIT' });
    }
  }, []);

  // fetch when selection is changed
  useEffect(() => {
    setFormatCode(selectedFormatOption.code);
    if (selectedFormatOption.id !== 'new' || (selectedFormatOption.id === 'new' && formatCode !== '')) {
      dispatch({ type: 'SET_CUSTOM_FORMAT', payload: selectedFormatOption.code });
      dispatch({ type: 'SUBMIT' });
    }
  }, [selectedFormatOption]);

  const handleFormatCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormatCode(e.target.value);
  };

  const handleSubmitNewCustomCode = () => {
    if (formatCode && formatCode !== '') {
      dispatch({ type: 'SET_CUSTOM_FORMAT', payload: formatCode });
      dispatch({ type: 'SUBMIT' });
    }
  };

  return (
    <>
      <FormControl>
        <FormLabel>Select Custom Format</FormLabel>
      </FormControl>
      <Select
        label="Custom Formats"
        id="custom-format-select"
        options={customFormatOptions}
        stylesTheme="default"
        value={selectedFormatOption}
        onChange={setSelectedFormatOption}
      ></Select>
      <Input
        placeholder="Enter a custom format"
        size="md"
        isReadOnly={selectedFormatOption.id !== 'new'}
        backgroundColor={selectedFormatOption.id === 'new' ? 'transparent' : 'gray.50'}
        value={formatCode}
        onChange={handleFormatCodeChange}
      />
      <Button
        onClick={handleSubmitNewCustomCode}
        width="full"
        isDisabled={selectedFormatOption.id !== 'new' || formatCode === ''}
      >
        Submit
      </Button>
    </>
  );
};
