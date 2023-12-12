import { IExportApiParams } from '@api';
import { Code, FormLabel } from '@chakra-ui/react';
import { Slider } from '@components/Slider';
import { APP_DEFAULTS } from '@config';
import { Dispatch, ReactNode, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

export const MaxAuthorsSlider = (props: {
  maxauthor: IExportApiParams['maxauthor'];
  dispatch: Dispatch<CitationExporterEvent>;
  isBasicMode: boolean;
  label?: string;
  description?: ReactNode;
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
              range={[0, APP_DEFAULTS.MAX_AUTHORCUTOFF]}
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
    Maximum number of authors displayed. In advanced mode, this only applies if the number of authors exceed{' '}
    <Code>authorcutoff</Code>.
  </p>
);
