import { IExportApiParams, MAX_AUTHORCUTOFF } from '@api';
import { FormLabel } from '@chakra-ui/react';
import { Slider } from '@components/Slider';
import { Dispatch, ReactElement, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

export const MaxAuthorsSlider = (props: {
  maxauthor: IExportApiParams['maxauthor'];
  dispatch: Dispatch<CitationExporterEvent>;
  isBasicMode: boolean;
  label?: string;
  description?: ReactElement;
}) => {
  const { maxauthor: [maxauthor] = [], isBasicMode, dispatch } = props;
  const [value, setValue] = useState(maxauthor);
  const [debouncedValue] = useDebounce(value, 300);

  // in basic mode, max author and author cutoff are always the same
  useEffect(() => {
    dispatch({ type: 'SET_MAX_AUTHOR', payload: debouncedValue });
    if (isBasicMode) {
      dispatch({ type: 'SET_AUTHOR_CUTOFF', payload: debouncedValue });
    }
  }, [debouncedValue]);

  const handleChange = (val: number[]) => setValue(val[0]);
  const label = props.label ?? 'Max Authors';

  return (
    <>
      <DescriptionCollapse body={props.description ?? description} label={label}>
        {({ btn, content }) => (
          <>
            <FormLabel htmlFor="maxauthor-slider" fontSize={['sm', 'md']}>
              {label} <span aria-hidden="true">({value === 0 ? 'ALL' : value})</span> {btn}
            </FormLabel>
            {content}
            <Slider
              id="maxauthor-slider"
              aria-label={label}
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
