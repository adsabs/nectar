import { Box, FormLabel } from '@chakra-ui/react';
import { Slider } from '@/components/Slider';
import { Dispatch, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CitationExporterEvent, ICitationExporterState } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

export const RecordSlider = (props: {
  records: string[];
  range: ICitationExporterState['range'];
  dispatch: Dispatch<CitationExporterEvent>;
}) => {
  const { range, records, dispatch } = props;
  const [value, setValue] = useState(range[1]);
  const [debouncedValue] = useDebounce(value, 300);

  useEffect(() => {
    dispatch({ type: 'SET_RANGE', payload: debouncedValue });
  }, [debouncedValue]);

  const handleChange = (val: number[]) => setValue(val[0]);

  return (
    <Box>
      <DescriptionCollapse body={description} label="Limit Records">
        {({ btn, content }) => (
          <>
            <FormLabel htmlFor="records-slider" fontSize={['sm', 'md']}>
              Limit Records <span aria-hidden="true">({value})</span> {btn}
            </FormLabel>
            {content}
          </>
        )}
      </DescriptionCollapse>
      <Slider
        id="records-slider"
        aria-label="Limit Records"
        range={[1, records.length]}
        values={[value]}
        onSlideEnd={handleChange}
        size={1}
        px={4}
      />
    </Box>
  );
};

const description = <>Limit the number of total records retrieved.</>;
