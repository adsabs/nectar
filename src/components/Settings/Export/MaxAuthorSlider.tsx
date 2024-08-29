import { DescriptionCollapse } from '@/components';
import { APP_DEFAULTS } from '@/config';
import {
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

export interface IMaxAuthorSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export const MaxAuthorSlider = ({ value: defaultValue, onChange }: IMaxAuthorSliderProps) => {
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
