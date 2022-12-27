import { IExportApiParams, MAX_AUTHORCUTOFF } from '@api';
import { Code, FormLabel } from '@chakra-ui/react';
import { Slider } from '@components/Slider';
import { Sender } from '@xstate/react/lib/types';
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

  const handleChange = (val: number[]) => setValue(val[0]);

  return (
    <DescriptionCollapse
      body={description}
      label="Author Cut-off"
      linkProps={{ href: '/help/actions/export#the-bibtex-format-configuration' }}
    >
      {({ btn, content }) => (
        <>
          <FormLabel htmlFor="authorcutoff-slider" fontSize={['sm', 'md']}>
            Author Cut-off <span aria-hidden="true">({value})</span> {btn}
          </FormLabel>
          {content}
          <Slider
            id="authorcutoff-slider"
            aria-label="Author Cutoff"
            range={[1, MAX_AUTHORCUTOFF]}
            values={[value]}
            onChange={handleChange}
            size={1}
            px={4}
          />
        </>
      )}
    </DescriptionCollapse>
  );
};

const description = (
  <p>
    The threshold for truncating number of authors. If the number of authors is larger than <Code>authorcutoff</Code>,
    author list is truncated and <Code>maxauthor</Code> number of authors will be returned followed by{' '}
    <Code>et al.</Code>. If <Code>authorcutoff</Code> is not specified, the default of 200 is used.
  </p>
);
