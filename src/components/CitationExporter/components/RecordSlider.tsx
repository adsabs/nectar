import { FormLabel, Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/react';
import { Sender } from '@xstate/react/lib/types';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CitationExporterEvent, ICitationExporterState } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

export const RecordSlider = (props: {
  records: string[];
  range: ICitationExporterState['range'];
  dispatch: Sender<CitationExporterEvent>;
}) => {
  const { range, records, dispatch } = props;
  const [value, setValue] = useState(range[1]);
  const [debouncedValue] = useDebounce(value, 300);

  useEffect(() => {
    dispatch({ type: 'SET_RANGE', payload: debouncedValue });
  }, [debouncedValue]);

  const handleChange = (val: number) => setValue(val);

  return (
    <>
      <DescriptionCollapse body={description} label="Limit Records" linkProps={{ href: '/help/actions/export' }}>
        {({ btn, content }) => (
          <>
            <FormLabel htmlFor="records-slider">
              Limit Records <span aria-hidden="true">({value})</span> {btn}
            </FormLabel>
            {content}
          </>
        )}
      </DescriptionCollapse>

      <Slider
        id="records-slider"
        aria-label="Limit Records"
        name="records"
        value={value}
        max={records.length}
        min={1}
        onChange={handleChange}
      >
        <SliderTrack bg="blue.100">
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </>
  );
};

const description = <p>Limit the number of total records retrieved.</p>;
