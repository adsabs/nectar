import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  GridItem,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { APP_DEFAULTS } from '@/config';
import { useRouter } from 'next/router';
import { ChangeEventHandler, Dispatch, HTMLAttributes, ReactElement, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { CitationExporterEvent } from './CitationExporter.machine';
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
import { exportFormats } from './models';
import { useCitationExporter } from './useCitationExporter';
import { noop } from '@/utils/common/noop';
import { ExportApiFormatKey, ExportApiJournalFormat, IExportApiParams, isExportApiFormat } from '@/api/export/types';
import { IDocsEntity } from '@/api/search/types';
import { SolrSort } from '@/api/models';
import { logger } from '@/logger';

export interface ICitationExporterProps extends HTMLAttributes<HTMLDivElement> {
  singleMode?: boolean;
  initialFormat?: ExportApiFormatKey;
  authorcutoff?: number;
  keyformat?: string;
  journalformat?: ExportApiJournalFormat;
  maxauthor?: number;
  records?: IDocsEntity['bibcode'][];
  totalRecords?: number;
  page?: number;
  nextPage?: () => void;
  hasNextPage?: boolean;
  sort?: SolrSort[];
}

/**
 * Citation export component
 */
export const CitationExporter = (props: ICitationExporterProps): ReactElement => {
  // early escape here, to skip extra work if nothing is passed
  if (props.records.length === 0 || typeof props.records[0] !== 'string') {
    return <ExportContainer header={<>No Records</>} />;
  }

  // wrap component here with error boundary to capture run-away errors
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Exporter {...props} />
    </ErrorBoundary>
  );
};

const Exporter = (props: ICitationExporterProps): ReactElement => {
  const {
    singleMode = false,
    initialFormat = ExportApiFormatKey.bibtex,
    authorcutoff,
    keyformat,
    journalformat,
    maxauthor,
    records = [],
    totalRecords = records.length,
    page = 0,
    nextPage = noop,
    hasNextPage = true,
    sort,
    ...divProps
  } = props;

  const { data, state, dispatch } = useCitationExporter({
    format: initialFormat,
    authorcutoff,
    keyformat,
    journalformat,
    maxauthor,
    records,
    singleMode,
    sort,
  });
  const ctx = state.context;
  const isLoading = state.matches('fetching');
  const router = useRouter();

  // Updates the route when format has changed
  useEffect(() => {
    if (
      router.query.format !== ctx.params.format &&
      (state.matches('idle') || (state.matches('fetching') && !singleMode))
    ) {
      void router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, format: ctx.params.format },
        },
        null,
        {
          shallow: true,
        },
      );
    }
  }, [state.value, router.query, ctx.params.format]);

  // Attempt to parse the url to grab the format, then update it, otherwise allow the server to handle the path
  useEffect(() => {
    router.beforePopState(({ as }) => {
      try {
        const format = as.split('?')[0].slice(as.lastIndexOf('/') + 1);
        if (isExportApiFormat(format)) {
          dispatch({ type: 'SET_FORMAT', payload: format });
          dispatch('FORCE_SUBMIT');
          return false;
        }
      } catch (err) {
        logger.error({ err, as }, 'Error caught attempting to parse format from url');
        dispatch({ type: 'SET_FORMAT', payload: ExportApiFormatKey.bibtex });
        dispatch('FORCE_SUBMIT');
      }
      return true;
    });
    return () => router.beforePopState(() => true);
  }, [dispatch, router]);

  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT' });
  };

  const handleTabChange = (index: number) => {
    dispatch({
      type: 'SET_IS_CUSTOM_FORMAT',
      payload: { isCustomFormat: index === 1 },
    });
  };

  return (
    <ExportContainer
      header={
        <Stack direction="row" alignItems="center" gap={4}>
          <>
            Exporting record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''}{' '}
            {ctx.range[0] + 1 + page * APP_DEFAULTS.EXPORT_PAGE_SIZE} to{' '}
            {ctx.range[1] + page * APP_DEFAULTS.EXPORT_PAGE_SIZE} (total: {totalRecords.toLocaleString()})
          </>
          {!singleMode && hasNextPage && (
            <Button
              variant="outline"
              rightIcon={<ChevronRightIcon fontSize="2xl" />}
              onClick={nextPage}
              isLoading={isLoading}
            >
              Next {APP_DEFAULTS.EXPORT_PAGE_SIZE}
            </Button>
          )}
        </Stack>
      }
      isLoading={isLoading}
      {...divProps}
    >
      <Grid templateColumns={{ base: 'auto', md: 'repeat(2, 1fr)' }} templateRows={{ base: '1fr', md: '1fr' }} gap={4}>
        <GridItem>
          <Tabs onChange={handleTabChange} defaultIndex={initialFormat === ExportApiFormatKey.custom ? 1 : 0}>
            <TabList>
              <Tab>Built-in Formats</Tab>
              <Tab>Custom Formats</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <form method="GET" onSubmit={handleOnSubmit}>
                  <Stack direction={['column', 'row']} spacing={4} align="stretch">
                    <Stack spacing="4" flex="1">
                      <FormatSelect format={ctx.params.format} dispatch={dispatch} />
                      <AdvancedControls dispatch={dispatch} params={ctx.params} />
                      {ctx.records.length > 1 && (
                        <RecordField range={ctx.range} records={ctx.records} dispatch={dispatch} />
                      )}

                      <Stack direction={'row'}>
                        {(!singleMode ||
                          (singleMode &&
                            (ctx.params.format === ExportApiFormatKey.bibtex ||
                              ctx.params.format === ExportApiFormatKey.bibtexabs))) && (
                          <Button type="submit" data-testid="export-submit" isLoading={isLoading} width="full">
                            Submit
                          </Button>
                        )}
                      </Stack>
                      <Divider display={['block', 'none']} />
                    </Stack>
                  </Stack>
                </form>
              </TabPanel>
              <TabPanel>
                <Stack direction={['column', 'row']} spacing={4}>
                  <Stack spacing="4" flexGrow={[3, 2]} maxW="lg">
                    <CustomFormatSelect dispatch={dispatch} />
                  </Stack>
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </GridItem>
        <GridItem>
          <ResultArea result={data?.export} format={ctx.params.format} isLoading={isLoading} flexGrow={5} />
        </GridItem>
      </Grid>
    </ExportContainer>
  );
};

const AdvancedControls = ({
  dispatch,
  params,
}: {
  dispatch: Dispatch<CitationExporterEvent>;
  params: IExportApiParams;
}) => {
  const { onToggle, isOpen } = useDisclosure();

  // if default cutoff and max authors are equal, show basic mode, otherwise use advance mode

  const [isBasicMode, setIsBasicMode] = useState(params.authorcutoff[0] === params.maxauthor[0]);

  const toggleMode = () => {
    setIsBasicMode((prev) => !prev);
  };

  if (params.format === ExportApiFormatKey.bibtex || params.format === ExportApiFormatKey.bibtexabs) {
    return (
      <Box>
        <Button variant="link" rightIcon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} onClick={onToggle}>
          More Options
        </Button>
        <Collapse in={isOpen}>
          <Stack spacing="4">
            <Divider />
            <JournalFormatSelect journalformat={params.journalformat} dispatch={dispatch} />
            <KeyFormatInput keyformat={params.keyformat} dispatch={dispatch} />
            {isBasicMode ? (
              <VStack alignItems="end">
                <Button variant="link" onClick={toggleMode}>
                  switch to advanced mode
                </Button>
              </VStack>
            ) : (
              <VStack alignItems="end">
                <Button variant="link" onClick={toggleMode}>
                  switch to basic mode
                </Button>
              </VStack>
            )}
            {!isBasicMode && <AuthorCutoffField authorcutoff={params.authorcutoff} dispatch={dispatch} />}
            <MaxAuthorsField maxauthor={params.maxauthor} dispatch={dispatch} isBasicMode={isBasicMode} />
          </Stack>
        </Collapse>
      </Box>
    );
  }
  return null;
};

/**
 * Static component for SSR
 */
const Static = (props: Omit<ICitationExporterProps, 'page' | 'nextPage'>): ReactElement => {
  const { records, initialFormat, singleMode, totalRecords, sort, ...divProps } = props;

  const { data, state } = useCitationExporter({
    format: initialFormat,
    records,
    singleMode: true,
    sort,
  });
  const ctx = state.context;

  const format = exportFormats[ctx.params.format];

  if (singleMode) {
    return (
      <ExportContainer header={<>Exporting record in {format.label} format</>} {...divProps}>
        <ResultArea result={data?.export} format={ctx.params.format} />
      </ExportContainer>
    );
  }

  return (
    <ExportContainer
      header={
        <>
          Exporting record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''} {ctx.range[0] + 1} to {ctx.range[1]} (total:{' '}
          {totalRecords.toLocaleString()})
        </>
      }
      {...divProps}
    >
      <ResultArea result={data?.export} format={ctx.params.format} />
    </ExportContainer>
  );
};

CitationExporter.Static = Static;
