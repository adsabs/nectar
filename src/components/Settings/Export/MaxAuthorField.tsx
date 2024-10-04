import { APP_DEFAULTS } from '@/config';
import {
  Flex,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { DescriptionCollapse } from '@/components/CitationExporter';

export interface IMaxAuthorFieldProps {
  value: number;
  onChange: (v: number) => void;
}

export const MaxAuthorField = ({ value: defaultValue, onChange }: IMaxAuthorFieldProps) => {
  const [value, setValue] = useState(defaultValue);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedValue >= APP_DEFAULTS.MIN_EXPORT_AUTHORS && debouncedValue <= APP_DEFAULTS.MAX_EXPORT_AUTHORS) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <DescriptionCollapse
      body={`Set between ${APP_DEFAULTS.MIN_EXPORT_AUTHORS} and ${APP_DEFAULTS.MAX_EXPORT_AUTHORS}`}
      label="Maximum Authors"
    >
      {({ btn, content }) => (
        <Flex direction="column">
          <FormLabel htmlFor="maxauthor-input" fontSize={['sm', 'md']}>
            Maximum Authors {btn}
          </FormLabel>
          {content}
          <NumberInput
            id="maxauthor-input"
            defaultValue={defaultValue}
            min={APP_DEFAULTS.MIN_EXPORT_AUTHORS}
            max={APP_DEFAULTS.MAX_EXPORT_AUTHORS}
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
        </Flex>
      )}
    </DescriptionCollapse>
  );
};
