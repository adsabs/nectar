import { ExportApiJournalFormat, IExportApiParams } from '@api';
import { Box, FormLabel, OrderedList } from '@chakra-ui/react';
import { Select, SelectOption } from '@components/Select';
import { values } from 'ramda';
import { Dispatch, useMemo } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { DescriptionCollapse } from './DescriptionCollapse';

type JournalFormatOption = SelectOption<ExportApiJournalFormat>;

const journalFormats: Record<ExportApiJournalFormat, JournalFormatOption> = {
  [ExportApiJournalFormat.AASTeXMacros]: {
    id: ExportApiJournalFormat.AASTeXMacros,
    label: 'AASTeX Macros',
    help: '',
    value: `${ExportApiJournalFormat.AASTeXMacros}`,
  },
  [ExportApiJournalFormat.Abbreviations]: {
    id: ExportApiJournalFormat.Abbreviations,
    label: 'Journal Abbreviations',
    help: '',
    value: `${ExportApiJournalFormat.Abbreviations}`,
  },
  [ExportApiJournalFormat.FullName]: {
    id: ExportApiJournalFormat.FullName,
    label: 'Journal Fullname',
    help: '',
    value: `${ExportApiJournalFormat.FullName}`,
  },
};

export const JournalFormatSelect = (props: {
  journalformat: IExportApiParams['journalformat'];
  dispatch: Dispatch<CitationExporterEvent>;
}) => {
  const { journalformat: [journalformat] = [], dispatch } = props;
  const formats = useMemo(() => values(journalFormats), []);

  const handleOnChange = ({ id }: JournalFormatOption) => {
    dispatch({ type: 'SET_JOURNAL_FORMAT', payload: id });
  };

  return (
    <DescriptionCollapse
      body={description}
      label="Journal Format"
      linkProps={{ href: '/help/actions/export#the-bibtex-format-configuration' }}
    >
      {({ btn, content }) => (
        <>
          <Select<JournalFormatOption>
            name="journalformat"
            label={
              <Box mb="2">
                <FormLabel htmlFor="journal-format-select" fontSize={['sm', 'md']}>
                  Journal Format {btn}
                </FormLabel>
                {content}
              </Box>
            }
            aria-label="Journal Format"
            hideLabel={false}
            id="journal-format-select"
            options={formats}
            value={journalFormats[journalformat]}
            onChange={handleOnChange}
            data-testid="export-select"
            stylesTheme="default"
          />
        </>
      )}
    </DescriptionCollapse>
  );
};

const description = (
  <>
    Allows user to decide on the format of journal name.
    <OrderedList>
      <li>Indicates to use AASTeX macros if there are any (default), otherwise full journal name is exported. </li>
      <li>Use journal abbreviations</li>
      <li>Use full journal name</li>
    </OrderedList>
  </>
);
