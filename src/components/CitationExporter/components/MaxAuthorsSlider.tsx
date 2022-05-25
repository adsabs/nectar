import { IExportApiParams, MAX_AUTHORCUTOFF } from '@api';
import { FormLabel, Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/react';
import { Sender } from '@xstate/react/lib/types';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

export const MaxAuthorsSlider = (props: {
  maxauthor: IExportApiParams['maxauthor'];
  dispatch: Sender<CitationExporterEvent>;
}) => {
  const { maxauthor: [maxauthor] = [], dispatch } = props;
  const [value, setValue] = useState(maxauthor);
  const [debouncedValue] = useDebounce(value, 300);

  useEffect(() => {
    dispatch({ type: 'SET_MAX_AUTHOR', payload: debouncedValue });
  }, [debouncedValue]);

  const handleChange = (val: number) => setValue(val);

  return (
    <>
      <DescriptionCollapse
        body={description}
        label="Max Authors"
        linkProps={{ href: '/help/actions/export#the-bibtex-format-configuration' }}
      >
        {({ btn, content }) => (
          <>
            <FormLabel htmlFor="maxauthor-slider" fontSize={['sm', 'md']}>
              Max Authors <span aria-hidden="true">({value === 0 ? 'ALL' : value})</span> {btn}
            </FormLabel>
            {content}
            <Slider
              id="maxauthor-slider"
              aria-label="Max Authors"
              name="maxauthor"
              value={value}
              max={MAX_AUTHORCUTOFF}
              min={0}
              onChange={handleChange}
            >
              <SliderTrack bg="blue.100">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </>
        )}
      </DescriptionCollapse>
      {/* <Slider
        id="maxauthor-slider"
        aria-label="Max Authors"
        name="maxauthor"
        value={value}
        max={MAX_AUTHORCUTOFF}
        min={0}
        onChange={handleChange}
      >
        <SliderTrack bg="blue.100">
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider> */}
    </>
  );
};

const description = (
  <p>
    Maximum number of authors displayed if number of authors exceed 200. The default values for maxauthor for BibTeX and
    BibTeX ABS are respectively 10 and 0, where 0 means display all authors.
  </p>
);
