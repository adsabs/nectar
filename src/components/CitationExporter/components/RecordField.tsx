import {
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

export interface IRecordFieldProps {
  records: string[];
  range: [number, number];
  onRangeChange: (end: number) => void;
}

export const RecordField = (props: IRecordFieldProps) => {
  const { range, records, onRangeChange } = props;
  const [value, setValue] = useState(range[1]);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    onRangeChange(debouncedValue);
  }, [debouncedValue, onRangeChange]);

  return (
    <HStack spacing={2} align="center">
      <Text fontSize="sm" whiteSpace="nowrap">
        Export first
      </Text>
      <NumberInput
        id="records-input"
        defaultValue={range[1]}
        min={1}
        max={records.length}
        size="sm"
        maxW="100px"
        onChange={(v) => {
          if (v.length > 0) {
            setValue(parseInt(v));
          }
        }}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
        of {records.length.toLocaleString()} records
      </Text>
    </HStack>
  );
};
