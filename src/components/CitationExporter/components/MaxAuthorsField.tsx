import {
  Code,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import { APP_DEFAULTS } from '@/config';
import { Dispatch, ReactElement, useEffect, useState } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';
import { useDebounce } from 'use-debounce';
import { IExportApiParams } from '@/api/export/types';

export const MaxAuthorsField = (props: {
  maxauthor: IExportApiParams['maxauthor'];
  dispatch: Dispatch<CitationExporterEvent>;
  isBasicMode: boolean;
  label?: string;
  description?: ReactElement;
}) => {
  const { maxauthor: [maxauthor] = [], isBasicMode, dispatch } = props;
  const [value, setValue] = useState(maxauthor);
  const [debouncedValue] = useDebounce(value, 500);

  // in basic mode, max author and author cutoff are always the same
  useEffect(() => {
    if (debouncedValue >= 0 && debouncedValue <= APP_DEFAULTS.MAX_EXPORT_AUTHORS) {
      dispatch({ type: 'SET_MAX_AUTHOR', payload: debouncedValue });
      if (isBasicMode) {
        dispatch({ type: 'SET_AUTHOR_CUTOFF', payload: debouncedValue });
      }
    }
  }, [debouncedValue]);

  const label = props.label ?? 'Max Authors';

  return (
    <>
      <DescriptionCollapse body={props.description ?? description} label={label}>
        {({ btn, content }) => (
          <>
            <FormLabel htmlFor="maxauthor-input" fontSize={['sm', 'md']}>
              {label} <span aria-hidden="true">({value === 0 ? 'ALL' : value})</span> {btn}
            </FormLabel>
            {content}
            <NumberInput
              id="maxauthor-input"
              defaultValue={maxauthor}
              min={0}
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
          </>
        )}
      </DescriptionCollapse>
    </>
  );
};

const description = (
  <p>
    Maximum number of authors displayed. Use values between <Code>0</Code> and{' '}
    <Code>{APP_DEFAULTS.MAX_EXPORT_AUTHORS}</Code>. Use <Code>0</Code> to display all authors. In advanced mode, this
    only applies if the number of authors exceed <Code>authorcutoff</Code>.
  </p>
);
