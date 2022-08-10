import { ExportApiFormatKey, IDocsEntity, IExportApiParams, isExportApiFormat, SolrSort } from '@api';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Collapse,
  Divider,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
} from '@chakra-ui/react';
import { APP_DEFAULTS } from '@config';
import { noop } from '@utils';
import { Sender } from '@xstate/react/lib/types';
import { useRouter } from 'next/router';
import { ChangeEventHandler, HTMLAttributes, ReactElement, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { CitationExporterEvent } from './CitationExporter.machine';
import { AuthorCutoffSlider } from './components/AuthorCutoffSlider';
import { CustomFormatSelect } from './components/CustomFormatSelect';
import { ErrorFallback } from './components/ErrorFallback';
import { ExportContainer } from './components/ExportContainer';
import { FormatSelect } from './components/FormatSelect';
import { JournalFormatSelect } from './components/JournalFormatSelect';
import { KeyFormatInput } from './components/KeyFormatInput';
import { MaxAuthorsSlider } from './components/MaxAuthorsSlider';
import { RecordSlider } from './components/RecordSlider';
import { ResultArea } from './components/ResultArea';
import { exportFormats } from './models';
import { useCitationExporter } from './useCitationExporter';

export interface ICitationExporterProps extends HTMLAttributes<HTMLDivElement> {
  singleMode?: boolean;
  initialFormat?: ExportApiFormatKey;
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
  if (props.records.length === 0) {
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
      ((state.matches('idle') && singleMode) || (state.matches('fetching') && !singleMode))
    ) {
      void router.push({ pathname: router.pathname, query: { ...router.query, format: ctx.params.format } }, null, {
        shallow: true,
      });
    }
  }, [state.value, state.context.params.format]);

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
      } catch (e) {
        dispatch({ type: 'SET_FORMAT', payload: ExportApiFormatKey.bibtex });
        dispatch('FORCE_SUBMIT');
      }
      return true;
    });
    return () => router.beforePopState(() => true);
  }, []);

  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT' });
  };

  const handleTabChange = (index: number) => {
    dispatch({ type: 'SET_IS_CUSTOM_FORMAT', payload: index === 1 });
  };

  // single mode, this is used for simple displays (like a single abstract)
  if (singleMode) {
    return (
      <ExportContainer
        header={
          <>
            Exporting {ctx.records.length} record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''} (total:{' '}
            {totalRecords.toLocaleString()})
          </>
        }
        isLoading={isLoading}
        {...divProps}
      >
        <Stack direction="column" spacing={4}>
          <FormatSelect format={ctx.params.format} dispatch={dispatch} />
          <ResultArea result={data?.export} format={ctx.params.format} isLoading={isLoading} />
        </Stack>
      </ExportContainer>
    );
  }

  return (
    <ExportContainer
      header={
        <>
          Exporting record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''}{' '}
          {ctx.range[0] + 1 + page * APP_DEFAULTS.EXPORT_PAGE_SIZE} to{' '}
          {ctx.range[1] + page * APP_DEFAULTS.EXPORT_PAGE_SIZE} (total: {totalRecords.toLocaleString()})
        </>
      }
      isLoading={isLoading}
      {...divProps}
    >
      <Tabs onChange={handleTabChange}>
        <TabList>
          <Tab>Built-in Formats</Tab>
          <Tab>Custom Formats</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <form method="GET" onFilterSubmit={handleOnSubmit}>
              <Stack direction={['column', 'row']} spacing={4} align="stretch">
                <Stack spacing="4" flex="1">
                  <FormatSelect format={ctx.params.format} dispatch={dispatch} />
                  <AdvancedControls dispatch={dispatch} params={ctx.params} />
                  <RecordSlider range={ctx.range} records={ctx.records} dispatch={dispatch} />

                  <Stack direction={'row'}>
                    <Button type="submit" data-testid="export-submit" isLoading={isLoading} isFullWidth>
                      Submit
                    </Button>
                    {hasNextPage && (
                      <Button
                        variant="outline"
                        rightIcon={<ChevronRightIcon fontSize="2xl" />}
                        onClick={nextPage}
                        isLoading={isLoading}
                        isFullWidth
                      >
                        Next {APP_DEFAULTS.EXPORT_PAGE_SIZE}
                      </Button>
                    )}
                  </Stack>
                  <Divider display={['block', 'none']} />
                </Stack>
                <ResultArea result={data?.export} format={ctx.params.format} isLoading={isLoading} flex="1" />
              </Stack>
            </form>
          </TabPanel>
          <TabPanel>
            <form method="GET" onFilterSubmit={handleOnSubmit}>
              <Stack direction={['column', 'row']} spacing={4}>
                <Stack spacing="4" flexGrow={[3, 2]} maxW="lg">
                  <CustomFormatSelect dispatch={dispatch} />
                </Stack>
                {/* <ResultArea result={data?.export} format={ctx.params.format} /> */}
              </Stack>
            </form>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </ExportContainer>
  );
};

const AdvancedControls = ({
  dispatch,
  params,
}: {
  dispatch: Sender<CitationExporterEvent>;
  params: IExportApiParams;
}) => {
  const { onToggle, isOpen } = useDisclosure();

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
            <AuthorCutoffSlider authorcutoff={params.authorcutoff} dispatch={dispatch} />
            <MaxAuthorsSlider maxauthor={params.maxauthor} dispatch={dispatch} />
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

  const { data, state } = useCitationExporter({ format: initialFormat, records, singleMode: true, sort });
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
