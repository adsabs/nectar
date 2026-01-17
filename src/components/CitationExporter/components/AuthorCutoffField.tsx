import {
  Code,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import { ReactElement, useEffect, useState } from 'react';
import { DescriptionCollapse } from './DescriptionCollapse';
import { APP_DEFAULTS } from '@/config';
import { useDebounce } from 'use-debounce';

export interface IAuthorCutoffFieldProps {
  authorcutoff: number[] | number;
  onAuthorcutoffChange: (authorcutoff: number) => void;
  label?: string;
  description?: ReactElement;
}

export const AuthorCutoffField = (props: IAuthorCutoffFieldProps) => {
  const authorcutoff = Array.isArray(props.authorcutoff) ? props.authorcutoff[0] : props.authorcutoff;
  const { onAuthorcutoffChange } = props;
  const [value, setValue] = useState(authorcutoff);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedValue >= APP_DEFAULTS.MIN_AUTHORCUTOFF && debouncedValue <= APP_DEFAULTS.MAX_AUTHORCUTOFF) {
      onAuthorcutoffChange(debouncedValue);
    }
  }, [debouncedValue, onAuthorcutoffChange]);

  const label = props.label ?? 'Author Cut-off';

  return (
    <DescriptionCollapse body={props.description ?? description} label={label}>
      {({ btn, content }) => (
        <>
          <FormLabel htmlFor="authorcutoff-input" fontSize={['sm', 'md']}>
            {label} <span aria-hidden="true">({value})</span> {btn}
          </FormLabel>
          {content}
          <NumberInput
            id="authorcutoff-input"
            defaultValue={authorcutoff}
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
        </>
      )}
    </DescriptionCollapse>
  );
};

const description = (
  <p>
    The threshold for truncating number of authors. Use values between <Code>{APP_DEFAULTS.MIN_AUTHORCUTOFF}</Code> and{' '}
    <Code>{APP_DEFAULTS.MAX_AUTHORCUTOFF}</Code>. If the number of authors is larger than <Code>authorcutoff</Code>,
    author list is truncated and <Code>maxauthor</Code> number of authors will be returned followed by{' '}
    <Code>et al.</Code>.
  </p>
);
