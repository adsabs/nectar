import { ExportApiFormatKey, IDocsEntity, isExportApiFormat } from '@api';
import { Button, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ChangeEventHandler, HTMLAttributes, ReactElement, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
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
import { SortSelector } from './components/SortSelector';
import { exportFormats } from './models';
import { useCitationExporter } from './useCitationExporter';
export interface ICitationExporterProps extends HTMLAttributes<HTMLDivElement> {
  singleMode?: boolean;
  initialFormat?: ExportApiFormatKey;
  records?: IDocsEntity['bibcode'][];
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
  const { singleMode = false, initialFormat = ExportApiFormatKey.bibtex, records = [], ...divProps } = props;
  const { data, state, dispatch } = useCitationExporter({
    format: initialFormat,
    records,
    singleMode,
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
      const format = as.slice(as.lastIndexOf('/') + 1);
      if (isExportApiFormat(format)) {
        dispatch({ type: 'SET_FORMAT', payload: format });
        return false;
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
            Exporting record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''} {ctx.range[0] + 1} of {ctx.range[1]} (total:{' '}
            {ctx.records.length})
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

  const isBibtexFormat =
    ctx.params.format === ExportApiFormatKey.bibtex || ctx.params.format === ExportApiFormatKey.bibtexabs;

  return (
    <ExportContainer
      header={
        <>
          Exporting record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''} {ctx.range[0] + 1} of {ctx.range[1]} (total:{' '}
          {ctx.records.length})
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
            <form method="GET" onSubmit={handleOnSubmit}>
              <Stack direction={['column', 'row']} spacing={4}>
                <Stack spacing="4" flexGrow={[3, 2]} maxW="lg">
                  <FormatSelect format={ctx.params.format} dispatch={dispatch} />
                  <SortSelector sort={ctx.params.sort} dispatch={dispatch} />
                  {isBibtexFormat && (
                    <>
                      <JournalFormatSelect journalformat={ctx.params.journalformat} dispatch={dispatch} />
                      <KeyFormatInput />
                    </>
                  )}
                  <RecordSlider range={ctx.range} records={ctx.records} dispatch={dispatch} />
                  {isBibtexFormat && (
                    <>
                      <AuthorCutoffSlider authorcutoff={ctx.params.authorcutoff} dispatch={dispatch} />
                      <MaxAuthorsSlider maxauthor={ctx.params.maxauthor} dispatch={dispatch} />
                    </>
                  )}
                  <Button type="submit" data-testid="export-submit" size="md" isLoading={isLoading}>
                    Submit
                  </Button>
                </Stack>
                <ResultArea result={data?.export} format={ctx.params.format} isLoading={isLoading} />
              </Stack>
            </form>
          </TabPanel>
          <TabPanel>
            <form method="GET" onSubmit={handleOnSubmit}>
              <Stack direction={['column', 'row']} spacing={4}>
                <Stack spacing="4" flexGrow={[3, 2]} maxW="lg">
                  <CustomFormatSelect dispatch={dispatch} />
                  {/* <SortSelector sort={ctx.params.sort} dispatch={dispatch} />
                  <Button type="submit" data-testid="export-submit" size="md" isLoading={isLoading}>
                    Submit
                  </Button> */}
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

/**
 * Static component for SSR
 */
const Static = (props: Omit<ICitationExporterProps, 'singleMode'>): ReactElement => {
  const { records, initialFormat, ...divProps } = props;

  const { data, state } = useCitationExporter({ format: initialFormat, records, singleMode: true });
  const ctx = state.context;

  const format = exportFormats[ctx.params.format];

  return (
    <ExportContainer header={<>Exporting record in {format.label} format</>} {...divProps}>
      <ResultArea result={data?.export} format={ctx.params.format} />
    </ExportContainer>
  );
};

CitationExporter.Static = Static;
