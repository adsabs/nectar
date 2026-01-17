import { Box, FormLabel, OrderedList } from '@chakra-ui/react';
import { Select, SelectOption } from '@/components/Select';
import { values } from 'ramda';
import { ReactElement, useMemo } from 'react';
import { DescriptionCollapse } from './DescriptionCollapse';
import { ExportApiJournalFormat } from '@/api/export/types';

type JournalFormatOption = SelectOption<ExportApiJournalFormat>;

export const journalFormats: Record<ExportApiJournalFormat, JournalFormatOption> = {
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

export interface IJournalFormatSelectProps {
  journalformat: ExportApiJournalFormat[] | ExportApiJournalFormat;
  onChange: (format: ExportApiJournalFormat) => void;
  label?: string;
  description?: ReactElement;
}

export const JournalFormatSelect = (props: IJournalFormatSelectProps) => {
  const journalformat = Array.isArray(props.journalformat) ? props.journalformat[0] : props.journalformat;
  const { onChange } = props;
  const formats = useMemo(() => values(journalFormats), []);

  const handleOnChange = ({ id }: JournalFormatOption) => {
    onChange(id);
  };

  const labelText = props.label ?? 'Journal Format';

  return (
    <DescriptionCollapse body={props.description ?? description} label={labelText}>
      {({ btn, content }) => (
        <Select<JournalFormatOption>
          name="journalformat"
          label={
            <Box mb="2">
              <FormLabel htmlFor="journal-format-select" fontSize={['sm', 'md']}>
                {labelText} {btn}
              </FormLabel>
              {content}
            </Box>
          }
          aria-label={labelText}
          hideLabel={false}
          id="journal-format-select"
          options={formats}
          value={journalFormats[journalformat]}
          onChange={handleOnChange}
          data-testid="export-select"
          stylesTheme="default"
        />
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
