import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { APP_DEFAULTS } from '@/config';
import { FormEventHandler, HTMLAttributes, ReactElement, useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthorCutoffField } from './components/AuthorCutoffField';
import { CustomFormatSelect } from './components/CustomFormatSelect';
import { ErrorFallback } from './components/ErrorFallback';
import { ExportContainer } from './components/ExportContainer';
import { FormatSelect } from './components/FormatSelect';
import { JournalFormatSelect } from './components/JournalFormatSelect';
import { KeyFormatInput } from './components/KeyFormatInput';
import { MaxAuthorsField } from './components/MaxAuthorsField';
import { RecordField } from './components/RecordField';
import { ResultArea } from './components/ResultArea';
import { useCitationExporter } from './useCitationExporter';
import { ExportApiFormatKey, ExportApiJournalFormat } from '@/api/export/types';
import { IDocsEntity } from '@/api/search/types';
import { SolrSort } from '@/api/models';
import { useExportFormats } from '@/lib/useExportFormats';

export interface ICitationExporterProps extends HTMLAttributes<HTMLDivElement> {
  // Initial values from URL or defaults
  format?: string;
  initialFormat?: string;
  customFormat?: string;
  keyformat?: string;
  journalformat?: ExportApiJournalFormat;
  authorcutoff?: number;
  maxauthor?: number;
  records?: IDocsEntity['bibcode'][];
  sort?: SolrSort[];
  singleMode?: boolean;

  // Pagination info
  totalRecords?: number;
  page?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;

  // Optional callback when user submits - updates URL with final values
  onExportSubmit?: (params: {
    format: string;
    customFormat: string;
    keyformat: string;
    journalformat: ExportApiJournalFormat;
    authorcutoff: number;
    maxauthor: number;
  }) => void;
}

interface ExportState {
  format: string;
  customFormat: string;
  keyformat: string;
  journalformat: ExportApiJournalFormat;
  authorcutoff: number;
  maxauthor: number;
  rangeEnd: number;
}

const getDefaultMaxAuthor = (format: string, explicitMaxAuthor?: number): number => {
  if (explicitMaxAuthor !== undefined) {
    return explicitMaxAuthor;
  }
  switch (format) {
    case ExportApiFormatKey.bibtex:
      return APP_DEFAULTS.BIBTEX_DEFAULT_MAX_AUTHOR;
    case ExportApiFormatKey.bibtexabs:
      return APP_DEFAULTS.BIBTEX_ABS_DEFAULT_MAX_AUTHOR;
    default:
      return 0;
  }
};

/**
 * Citation export component.
 * Uses draft/submitted pattern - form edits don't trigger fetch until Submit.
 */
export const CitationExporter = (props: ICitationExporterProps): ReactElement => {
  const records = props.records ?? [];
  if (records.length === 0 || typeof records[0] !== 'string') {
    return <ExportContainer header={<>No Records</>} />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Exporter {...props} />
    </ErrorBoundary>
  );
};

const Exporter = (props: ICitationExporterProps): ReactElement => {
  const {
    format: propsFormat,
    initialFormat,
    customFormat: propsCustomFormat,
    keyformat: propsKeyformat,
    journalformat: propsJournalformat,
    authorcutoff: propsAuthorcutoff,
    maxauthor: propsMaxauthor,
    records = [],
    sort,
    singleMode = false,
    totalRecords = records.length,
    page = 0,
    hasNextPage = false,
    hasPrevPage = false,
    onNextPage,
    onPrevPage,
    onExportSubmit,
    ...divProps
  } = props;

  // Derive initial state from props
  const initialState = useMemo((): ExportState => {
    const format = propsFormat ?? initialFormat ?? ExportApiFormatKey.bibtex;
    return {
      format,
      customFormat: propsCustomFormat ?? '%1H:%Y:%q',
      keyformat: propsKeyformat ?? '%R',
      journalformat: propsJournalformat ?? ExportApiJournalFormat.AASTeXMacros,
      authorcutoff: propsAuthorcutoff ?? APP_DEFAULTS.BIBTEX_DEFAULT_AUTHOR_CUTOFF,
      maxauthor: getDefaultMaxAuthor(format, propsMaxauthor),
      rangeEnd: records.length,
    };
  }, []); // Only compute once on mount

  // Draft state - what user is editing in the form
  const [draft, setDraft] = useState<ExportState>(initialState);

  // Submitted state - what's actually being fetched
  const [submitted, setSubmitted] = useState<ExportState>(initialState);

  // Compute bibcodes to export based on SUBMITTED rangeEnd
  const bibcodesToExport = records.slice(0, submitted.rangeEnd);

  // Fetch export data using SUBMITTED state (not draft)
  const { data, isLoading } = useCitationExporter({
    format: submitted.format,
    customFormat: submitted.customFormat,
    keyformat: submitted.keyformat,
    journalformat: submitted.journalformat,
    authorcutoff: submitted.authorcutoff,
    maxauthor: submitted.maxauthor,
    bibcodes: bibcodesToExport,
    sort,
  });

  // Draft state setters
  const setFormat = useCallback((format: string) => {
    setDraft((d) => ({ ...d, format }));
  }, []);

  const setKeyformat = useCallback((keyformat: string) => {
    setDraft((d) => ({ ...d, keyformat }));
  }, []);

  const setJournalformat = useCallback((journalformat: ExportApiJournalFormat) => {
    setDraft((d) => ({ ...d, journalformat }));
  }, []);

  const setAuthorcutoff = useCallback((authorcutoff: number) => {
    setDraft((d) => ({ ...d, authorcutoff }));
  }, []);

  const setMaxauthor = useCallback((maxauthor: number) => {
    setDraft((d) => ({ ...d, maxauthor }));
  }, []);

  const setRangeEnd = useCallback((rangeEnd: number) => {
    setDraft((d) => ({ ...d, rangeEnd }));
  }, []);

  // Submit handler - copies draft to submitted and notifies parent
  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setSubmitted(draft);
    onExportSubmit?.(draft);
  };

  // Handle tab change between built-in and custom formats
  const handleTabChange = (index: number) => {
    const newFormat = index === 1 ? ExportApiFormatKey.custom : ExportApiFormatKey.bibtex;
    setFormat(newFormat);
    // Auto-submit on tab change since it's a major format change
    setSubmitted((s) => ({ ...s, format: newFormat }));
    onExportSubmit?.({ ...draft, format: newFormat });
  };

  // Handle custom format submit (from CustomFormatSelect's Submit button)
  const handleCustomFormatSubmit = useCallback(
    (customFormat: string) => {
      const newDraft = { ...draft, customFormat };
      setDraft(newDraft);
      setSubmitted(newDraft);
      onExportSubmit?.(newDraft);
    },
    [draft, onExportSubmit],
  );

  // Determine which tab should be active
  const isCustomFormat = draft.format === ExportApiFormatKey.custom;
  const tabIndex = isCustomFormat ? 1 : 0;

  return (
    <ExportContainer
      header={
        <Text>
          Showing records {1 + page * APP_DEFAULTS.EXPORT_PAGE_SIZE}–
          {draft.rangeEnd + page * APP_DEFAULTS.EXPORT_PAGE_SIZE} of {totalRecords.toLocaleString()}
        </Text>
      }
      isLoading={isLoading}
      {...divProps}
    >
      <Grid templateColumns={{ base: 'auto', md: 'repeat(2, 1fr)' }} templateRows={{ base: '1fr', md: '1fr' }} gap={4}>
        <GridItem>
          <Tabs index={tabIndex} onChange={handleTabChange}>
            <TabList>
              <Tab>Standard Formats</Tab>
              <Tab>Custom Format</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <form method="GET" onSubmit={handleSubmit}>
                  <Stack spacing={4}>
                    <FormatSelect format={draft.format} onFormatChange={setFormat} />
                    <BibTeXOptions
                      format={draft.format}
                      keyformat={draft.keyformat}
                      journalformat={draft.journalformat}
                      authorcutoff={draft.authorcutoff}
                      maxauthor={draft.maxauthor}
                      onKeyformatChange={setKeyformat}
                      onJournalformatChange={setJournalformat}
                      onAuthorcutoffChange={setAuthorcutoff}
                      onMaxauthorChange={setMaxauthor}
                    />
                    {records.length > 1 && (
                      <RecordField range={[0, draft.rangeEnd]} records={records} onRangeChange={setRangeEnd} />
                    )}
                    {(!singleMode ||
                      draft.format === ExportApiFormatKey.bibtex ||
                      draft.format === ExportApiFormatKey.bibtexabs) && (
                      <Button type="submit" data-testid="export-submit" isLoading={isLoading} width="full">
                        Export
                      </Button>
                    )}
                  </Stack>
                </form>
              </TabPanel>
              <TabPanel>
                <Stack direction={['column', 'row']} spacing={4}>
                  <Stack spacing="4" flexGrow={[3, 2]} maxW="lg">
                    <CustomFormatSelect
                      customFormat={draft.customFormat}
                      onCustomFormatChange={handleCustomFormatSubmit}
                    />
                  </Stack>
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </GridItem>
        <GridItem>
          <ResultArea result={data?.export} format={submitted.format} isLoading={isLoading} flexGrow={5} />
        </GridItem>
      </Grid>
      {!singleMode && (hasPrevPage || hasNextPage) && (
        <Flex justify="center" gap={4} mt={6}>
          {hasPrevPage && onPrevPage && (
            <Button variant="outline" leftIcon={<ChevronLeftIcon fontSize="xl" />} onClick={onPrevPage}>
              Previous {APP_DEFAULTS.EXPORT_PAGE_SIZE}
            </Button>
          )}
          {hasNextPage && onNextPage && (
            <Button
              variant="outline"
              rightIcon={<ChevronRightIcon fontSize="xl" />}
              onClick={onNextPage}
              isLoading={isLoading}
            >
              Next {APP_DEFAULTS.EXPORT_PAGE_SIZE}
            </Button>
          )}
        </Flex>
      )}
    </ExportContainer>
  );
};

interface BibTeXOptionsProps {
  format: string;
  keyformat: string;
  journalformat: ExportApiJournalFormat;
  authorcutoff: number;
  maxauthor: number;
  onKeyformatChange: (keyformat: string) => void;
  onJournalformatChange: (journalformat: ExportApiJournalFormat) => void;
  onAuthorcutoffChange: (authorcutoff: number) => void;
  onMaxauthorChange: (maxauthor: number) => void;
}

/**
 * BibTeX-specific options panel.
 * Only shown when BibTeX or BibTeX ABS format is selected.
 * Options are displayed directly (not hidden behind a collapse).
 */
const BibTeXOptions = ({
  format,
  keyformat,
  journalformat,
  authorcutoff,
  maxauthor,
  onKeyformatChange,
  onJournalformatChange,
  onAuthorcutoffChange,
  onMaxauthorChange,
}: BibTeXOptionsProps) => {
  // Local UI state: basic mode links maxauthor and authorcutoff
  const [isBasicMode, setIsBasicMode] = useState(authorcutoff === maxauthor);

  const toggleMode = () => {
    setIsBasicMode((prev) => !prev);
  };

  // In basic mode, when maxauthor changes, also update authorcutoff
  const handleMaxauthorChange = useCallback(
    (value: number) => {
      onMaxauthorChange(value);
      if (isBasicMode) {
        onAuthorcutoffChange(value);
      }
    },
    [onMaxauthorChange, onAuthorcutoffChange, isBasicMode],
  );

  if (format !== ExportApiFormatKey.bibtex && format !== ExportApiFormatKey.bibtexabs) {
    return null;
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200" bg="gray.50">
      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
        BibTeX Options
      </Text>
      <Stack spacing={3}>
        <JournalFormatSelect journalformat={journalformat} onChange={onJournalformatChange} />
        <KeyFormatInput keyformat={keyformat} onKeyformatChange={onKeyformatChange} />
        <MaxAuthorsField maxauthor={maxauthor} onMaxauthorChange={handleMaxauthorChange} isBasicMode={isBasicMode} />
        {!isBasicMode && <AuthorCutoffField authorcutoff={authorcutoff} onAuthorcutoffChange={onAuthorcutoffChange} />}
        <VStack alignItems="end">
          <Button variant="link" size="sm" onClick={toggleMode}>
            {isBasicMode ? 'Show advanced options' : 'Hide advanced options'}
          </Button>
        </VStack>
      </Stack>
    </Box>
  );
};

/**
 * Static component for SSR - simplified, no controls
 */
const Static = (
  props: {
    format: string;
    records: IDocsEntity['bibcode'][];
    singleMode?: boolean;
    totalRecords?: number;
    sort?: SolrSort[];
  } & HTMLAttributes<HTMLDivElement>,
): ReactElement => {
  const { records, format, singleMode, totalRecords = records.length, sort, ...divProps } = props;

  const { data } = useCitationExporter({
    format,
    customFormat: '%1H:%Y:%q',
    keyformat: '%R',
    journalformat: ExportApiJournalFormat.AASTeXMacros,
    authorcutoff: APP_DEFAULTS.BIBTEX_DEFAULT_AUTHOR_CUTOFF,
    maxauthor: APP_DEFAULTS.BIBTEX_DEFAULT_MAX_AUTHOR,
    bibcodes: records,
    sort,
  });

  const { getFormatById } = useExportFormats();
  const formatInfo = getFormatById(format);

  if (singleMode) {
    return (
      <ExportContainer header={<>Exporting record in {formatInfo.name} format</>} {...divProps}>
        <ResultArea result={data?.export} format={format} />
      </ExportContainer>
    );
  }

  return (
    <ExportContainer
      header={
        <>
          Exporting record{records.length > 1 ? 's' : ''} 1 to {records.length} (total: {totalRecords.toLocaleString()})
        </>
      }
      {...divProps}
    >
      <ResultArea result={data?.export} format={format} />
    </ExportContainer>
  );
};

CitationExporter.Static = Static;
