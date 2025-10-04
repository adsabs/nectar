import {
  Code,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import { Dispatch, ReactElement, useEffect, useState } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';
import { APP_DEFAULTS } from '@/config';
import { useDebounce } from 'use-debounce';
import { IExportApiParams } from '@/api/export/types';

export const AuthorCutoffField = (props: {
  authorcutoff: IExportApiParams['authorcutoff'];
  dispatch: Dispatch<CitationExporterEvent>;
  label?: string;
  description?: ReactElement;
}) => {
  const { authorcutoff: [authorcutoff] = [], dispatch } = props;
  const [value, setValue] = useState(authorcutoff);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedValue >= APP_DEFAULTS.MIN_AUTHORCUTOFF && debouncedValue <= APP_DEFAULTS.MAX_AUTHORCUTOFF) {
      dispatch({ type: 'SET_AUTHOR_CUTOFF', payload: debouncedValue });
    }
  }, [debouncedValue, dispatch]);

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
