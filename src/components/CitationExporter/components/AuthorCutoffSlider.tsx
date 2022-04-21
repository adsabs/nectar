import { FormLabel, Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/react';
import { Sender } from '@xstate/react/lib/types';
import { IExportApiParams, MAX_AUTHORCUTOFF } from '@_api/export';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

export const AuthorCutoffSlider = (props: {
  authorcutoff: IExportApiParams['authorcutoff'];
  dispatch: Sender<CitationExporterEvent>;
}) => {
  const { authorcutoff: [authorcutoff] = [], dispatch } = props;
  const [value, setValue] = useState(authorcutoff);
  const [debouncedValue] = useDebounce(value, 300);

  useEffect(() => {
    dispatch({ type: 'SET_AUTHOR_CUTOFF', payload: debouncedValue });
  }, [debouncedValue]);

  const handleChange = (val: number) => setValue(val);

  return (
    <>
      <DescriptionCollapse
        body={description}
        label="Author Cut-off"
        linkProps={{ href: '/help/actions/export#the-bibtex-format-configuration' }}
      >
        {({ btn, content }) => (
          <>
            <FormLabel htmlFor="authorcutoff-slider">
              Author Cut-off <span aria-hidden="true">({value})</span> {btn}
            </FormLabel>
            {content}
          </>
        )}
      </DescriptionCollapse>

      <Slider
        id="authorcutoff-slider"
        aria-label="Author Cutoff"
        name="authorcutoff"
        value={value}
        max={MAX_AUTHORCUTOFF}
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

const description = (
  <p>
    Maximum number of authors displayed if number of authors exceed 200. The default values for maxauthor for BibTeX and
    BibTeX ABS are respectively 10 and 0, where 0 means display all authors.
  </p>
);
