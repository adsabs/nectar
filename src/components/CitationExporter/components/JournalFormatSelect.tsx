import { OrderedList } from '@chakra-ui/react';
import { SelectOption } from '@components/Select';
import { Sender } from '@xstate/react/lib/types';
import { ExportApiJournalFormat, IExportApiParams } from '@_api/export';
import { CitationExporterEvent } from '../CitationExporter.machine';

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
  dispatch: Sender<CitationExporterEvent>;
}) => {
  // const { journalformat: [journalformat] = [], dispatch } = props;
  // const formats = useMemo(() => values(journalFormats), []);

  // const handleOnChange = ({ id }: JournalFormatOption) => {
  //   dispatch({ type: 'SET_JOURNAL_FORMAT', payload: id });
  // };

  return <div></div>;
  // <DescriptionCollapse
  //   body={description}
  //   label="Journal Format"
  //   linkProps={{ href: '/help/actions/export#the-bibtex-format-configuration' }}
  // >
  //   {({ btn, content }) => (
  //     <>
  //       <Select<JournalFormatOption>
  //         name="journalformat"
  //         label={
  //           <Box mb="2">
  //             <FormLabel htmlFor="journal-format-select">Journal Format {btn}</FormLabel>
  //             {content}
  //           </Box>
  //         }
  //         aria-label="Journal Format"
  //         hideLabel={false}
  //         id="journal-format-select"
  //         options={formats}
  //         value={journalFormats[journalformat]}
  //         onChange={handleOnChange}
  //         data-testid="export-select"
  //         stylesTheme="default"
  //       />
  //     </>
  //   )}
  // </DescriptionCollapse>
};

const description = (
  <p>
    Allows user to decide on the format of journal name.
    <OrderedList>
      <li>Indicates to use AASTeX macros if there are any (default), otherwise full journal name is exported. </li>
      <li>Use journal abbreviations</li>
      <li>Use full journal name</li>
    </OrderedList>
  </p>
);
