import { DescriptionCollapse } from '@/components/CitationExporter';
import { APP_DEFAULTS } from '@/config';
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormLabel,
  Flex,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

export interface IMaxAuthorCutoffFieldProps {
  value: number;
  onChange: (v: number) => void;
}

export const MaxAuthorCutoffField = ({ value: defaultValue, onChange }: IMaxAuthorCutoffFieldProps) => {
  const [value, setValue] = useState(defaultValue);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedValue >= APP_DEFAULTS.MIN_AUTHORCUTOFF && debouncedValue <= APP_DEFAULTS.MAX_AUTHORCUTOFF) {
      onChange(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <DescriptionCollapse
      body={`Between ${APP_DEFAULTS.MIN_AUTHORCUTOFF} and ${APP_DEFAULTS.MAX_AUTHORCUTOFF}`}
      label="Maximum Authors Cutoff"
    >
      {({ btn, content }) => (
        <Flex direction="column">
          <FormLabel htmlFor="authorcutoff-input" fontSize={['sm', 'md']}>
            Maximum Authors Cutoff {btn}
          </FormLabel>
          {content}
          <NumberInput
            id="authorcutoff-input"
            defaultValue={defaultValue}
            min={APP_DEFAULTS.MIN_AUTHORCUTOFF}
            max={APP_DEFAULTS.MAX_AUTHORCUTOFF}
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
