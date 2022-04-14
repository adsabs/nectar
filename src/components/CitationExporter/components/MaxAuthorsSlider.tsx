import { Code, FormLabel, Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/react';
import { Sender } from '@xstate/react/lib/types';
import { IExportApiParams, MAX_AUTHORCUTOFF } from '@_api/export';
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
            <FormLabel htmlFor="maxauthor-slider">
              Max Authors <span aria-hidden="true">({value === 0 ? 'ALL' : value})</span> {btn}
            </FormLabel>
            {content}
          </>
        )}
      </DescriptionCollapse>
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
  );
};

const description = (
  <p>
    The threshold for truncating number of authors. If the number of authors is larger than <Code>authorcutoff</Code>,
    author list is truncated and <Code>maxauthor</Code> number of authors will be returned followed by{' '}
    <Code>et al.</Code>. If <Code>authorcutoff</Code> is not specified, the default of 200 is used.
  </p>
);
