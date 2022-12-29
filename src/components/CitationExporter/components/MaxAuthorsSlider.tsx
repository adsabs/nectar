import { IExportApiParams, MAX_AUTHORCUTOFF } from '@api';
import { FormLabel } from '@chakra-ui/react';
import { Slider } from '@components/Slider';
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

  const handleChange = (val: number[]) => setValue(val[0]);

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
              range={[0, MAX_AUTHORCUTOFF]}
              values={[value]}
              onSlideEnd={handleChange}
              size={1}
              px={4}
            />
          </>
        )}
      </DescriptionCollapse>
    </>
  );
};

const description = (
  <p>
    Maximum number of authors displayed if number of authors exceed 200. The default values for maxauthor for BibTeX and
    BibTeX ABS are respectively 10 and 0, where 0 means display all authors.
  </p>
);
