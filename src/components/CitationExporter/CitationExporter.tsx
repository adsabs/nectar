import { IDocsEntity } from '@api';
import { Box, Button, Heading, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { ExportApiFormatKey } from '@_api/export';
import { ChangeEventHandler, FC, HTMLAttributes, ReactElement } from 'react';
import { AuthorCutoffSlider } from './components/AuthorCutoffSlider';
import { CustomFormatSelect } from './components/CustomFormatSelect';
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

export const CitationExporter = (props: ICitationExporterProps): ReactElement => {
  const { singleMode = false, initialFormat = ExportApiFormatKey.bibtex, records = [], ...divProps } = props;
  const { data, isLoading, state, dispatch } = useCitationExporter({ format: initialFormat, records, singleMode });

  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT' });
  };

  const handleTabChange = (index: number) => {
    dispatch({ type: 'SET_IS_CUSTOM_FORMAT', payload: index === 1 });
  };

  const ctx = state.context;

  if (ctx.records.length === 0) {
    return <Container header={<>No Records</>} />;
  }

  if (singleMode) {
    return (
      <Container
        header={
          <>
            Exporting record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''} {ctx.range[0] + 1} of {ctx.range[1]} (total:{' '}
            {ctx.records.length})
          </>
        }
        {...divProps}
      >
        <form method="GET" onSubmit={handleOnSubmit}>
          <Stack direction="column" spacing={4}>
            <FormatSelect format={ctx.params.format} dispatch={dispatch} />
            <ResultArea result={data?.export} format={ctx.params.format} />
          </Stack>
        </form>
      </Container>
    );
  }

  const isBibtexFormat =
    ctx.params.format === ExportApiFormatKey.bibtex || ctx.params.format === ExportApiFormatKey.bibtexabs;

  return (
    <Container
      header={
        <>
          Exporting record{ctx.range[1] - ctx.range[0] > 1 ? 's' : ''} {ctx.range[0] + 1} of {ctx.range[1]} (total:{' '}
          {ctx.records.length})
        </>
      }
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
                <ResultArea result={data?.export} format={ctx.params.format} />
              </Stack>
            </form>
          </TabPanel>
          <TabPanel>
            <form method="GET" onSubmit={handleOnSubmit}>
              <Stack direction={['column', 'row']} spacing={4}>
                <Stack spacing="4" flexGrow={[3, 2]} maxW="lg">
                  <CustomFormatSelect dispatch={dispatch} />
                  <SortSelector sort={ctx.params.sort} dispatch={dispatch} />
                  <Button type="submit" data-testid="export-submit" size="md" isLoading={isLoading}>
                    Submit
                  </Button>
                </Stack>
                <ResultArea result={data?.export} format={ctx.params.format} />
              </Stack>
            </form>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

const Container: FC<{ header: ReactElement } & HTMLAttributes<HTMLDivElement>> = ({
  children,
  header,
  ...divProps
}) => {
  return (
    <Box
      p="3"
      border="1px solid"
      borderRadius="8px"
      borderColor="lightgray"
      boxShadow="0px 2px 5.5px rgba(0, 0, 0, 0.02)"
      {...divProps}
    >
      <Heading as="h2" size="sm" mb="3" data-testid="export-heading">
        {header}
      </Heading>

      {children}
    </Box>
  );
};

const Static = (props: Omit<ICitationExporterProps, 'singleMode'>): ReactElement => {
  const { records, initialFormat, ...divProps } = props;

  const { data, state } = useCitationExporter({ format: initialFormat, records, singleMode: true });
  const ctx = state.context;

  const format = exportFormats[ctx.params.format];

  return (
    <Container header={<>Exporting record in {format.label} format</>} {...divProps}>
      <ResultArea result={data?.export} format={ctx.params.format} />
    </Container>
  );
};

CitationExporter.Static = Static;
