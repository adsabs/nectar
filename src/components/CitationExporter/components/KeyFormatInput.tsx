import { Box, Code, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { ChangeEventHandler, Dispatch, ReactElement, useCallback } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';
import { IExportApiParams } from '@/api/export/types';

interface IKeyFormatInputProps {
  keyformat: IExportApiParams['keyformat'];
  dispatch: Dispatch<CitationExporterEvent>;
  label?: string;
  description?: ReactElement;
}

export const KeyFormatInput = (props: IKeyFormatInputProps) => {
  const { keyformat, dispatch, label } = props;

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      dispatch({ type: 'SET_KEY_FORMAT', payload: e.currentTarget.value });
    },
    [dispatch],
  );

  return (
    <FormControl>
      <DescriptionCollapse body={props.description ?? description} label={label ?? 'Key Format'}>
        {({ btn, content }) => (
          <FormControl>
            <Box mb="2">
              <FormLabel fontSize={['sm', 'md']}>
                {label ?? 'Key Format'} {btn}
              </FormLabel>
              {content}
            </Box>
            <Input value={keyformat} size="md" borderRadius="sm" onChange={handleOnChange} placeholder="%1H:%Y:%q" />
          </FormControl>
        )}
      </DescriptionCollapse>
    </FormControl>
  );
};

const description = (
  <>
    <p>
      Allows user to customize bibtex key and could contain some combination of authors&#39; last name(s), publication
      year, journal, and bibcode. User is now able to pick the key generation algorithm by specifying a custom format
      for it. To provide a specific example, this is our default format for 2019AAS...23338108A:
    </p>
    <p>
      <Code display="block" whiteSpace="pre">
        {`@INPROCEEDINGS{2019AAS...23338108A,
author = {{Accomazzi}, Alberto and {Kurtz},
Michael J. and ...`}
      </Code>
    </p>

    <p>
      In addition <Code>keyformat</Code> accepts specifier <Code>%zm</Code> to enumerate keys (one character alphabet)
      should duplicate keys get created. Note that if enumeration specifier is not included, even if duplicate key are
      found, service does not enumerate the keys.
    </p>

    <p>Now user can define one of the following:</p>
    <p>
      <Code display="block" whiteSpace="pre">
        {`Accomazzi:2019              -- %1H:%Y
Accomazzi:2019:AAS          -- %1H:%Y:%q
Accomazzi2019               -- %1H%Y
Accomazzi2019AAS            -- %1H%Y%q
AccomazziKurtz2019          -- %2H%Y`}
      </Code>
    </p>
  </>
);
