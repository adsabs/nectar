import {
  Box,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import { Dispatch, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CitationExporterEvent, ICitationExporterState } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

export const RecordField = (props: {
  records: string[];
  range: ICitationExporterState['range'];
  dispatch: Dispatch<CitationExporterEvent>;
}) => {
  const { range, records, dispatch } = props;
  const [value, setValue] = useState(range[1]);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    dispatch({ type: 'SET_RANGE', payload: debouncedValue });
  }, [debouncedValue, dispatch]);

  return (
    <Box>
      <DescriptionCollapse body={description} label="Limit Records">
        {({ btn, content }) => (
          <>
            <FormLabel htmlFor="records-input" fontSize={['sm', 'md']}>
              Limit Records {btn}
            </FormLabel>
            {content}
          </>
        )}
      </DescriptionCollapse>
      <NumberInput
        id="records-input"
        defaultValue={range[1]}
        min={1}
        max={records.length}
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
    </Box>
  );
};

const description = <>Limit the number of total records retrieved.</>;
