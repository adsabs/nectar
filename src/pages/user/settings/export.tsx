import { ExportApiJournalFormat } from '@api';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Table,
  TableCaption,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Box,
} from '@chakra-ui/react';
import {
  AuthorCutoffSlider,
  DescriptionCollapse,
  ExportFormat,
  exportFormats,
  JournalFormatSelect,
  KeyFormatInput,
  MaxAuthorsSlider,
  Select,
  SettingsLayout,
  SimpleLink,
} from '@components';
import { composeNextGSSP, noop, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { values } from 'ramda';
import { useMemo } from 'react';

const exportFormatDescription = (
  <>
    Select the default export format you would like to use when opening the Export tool. (
    <strong>default: BibTeX</strong>)
  </>
);

const customFormatDescription = (
  <>
    Edit your saved custom formats. Check out our{' '}
    <SimpleLink href={'/help/actions/export'} newTab display="inline">
      docs
    </SimpleLink>{' '}
    for more information.
  </>
);

const bibtexExportFormatDescription = (
  <>
    Select the default key format when exporting in BibTeX (
    <SimpleLink href="/help/actions/export" newTab display="inline">
      Learn More
    </SimpleLink>
    )
    <Table my={2}>
      <TableCaption>Key format codes and descriptions</TableCaption>
      <Thead>
        <Tr>
          <Th>Code</Th>
          <Th>Description</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>
            <code>%R</code>
          </Td>
          <Td>Bibcode</Td>
        </Tr>
        <Tr>
          <Td>
            <code>%nH</code>
          </Td>
          <Td>
            Author, where <code>n</code> can be any number
          </Td>
        </Tr>
        <Tr>
          <Td>
            <code>%q</code>
          </Td>
          <Td>Publication</Td>
        </Tr>
        <Tr>
          <Td>
            <code>%Y</code>
          </Td>
          <Td>Year</Td>
        </Tr>
        <Tr>
          <Td>
            <code>%zm</code>
          </Td>
          <Td>Enumeration</Td>
        </Tr>
      </Tbody>
    </Table>
    <Text>* Any other text will be passed as raw strings</Text>(<strong>default: None</strong>)
  </>
);

const journalNameHandlingDescription = (
  <>
    This setting is used to define how journal names are rendered in the output of the following TeX-based formats:
    BibTeX, BibTeX ABS, and AASTeX. If journal macros are used (default), the following file contains the proper journal
    definitions compatible with most Astronomy Journals:{' '}
    <SimpleLink href={'http://adsabs.harvard.edu/abs_doc/aas_macros.html'} newTab>
      http://adsabs.harvard.edu/abs_doc/aas_macros.html
    </SimpleLink>
    (<strong>default: Use AASTeX macros</strong>)
  </>
);

const bibteMaxAuthorsDescription = (
  <>
    Select the default max number of authors shown when exporting in BibTeX, where 0 means display all authors. (
    <strong>default: 10</strong>)
  </>
);

const bibteAuthorCutoffDescription = (
  <>
    If the number of authors in the list is larger than the cutoff, the list will be truncated to the max number
    allowed, otherwise all will be shown. (<strong>default: 200</strong>)
  </>
);

const absExportFormatDescription = (
  <>
    Select the default key format when exporting in BibTeX ABS (
    <SimpleLink href="/help/actions/export" newTab display="inline">
      Learn More
    </SimpleLink>
    )
    <Table my={2}>
      <TableCaption>Key format codes and descriptions</TableCaption>
      <Thead>
        <Tr>
          <Th>Code</Th>
          <Th>Description</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>
            <code>%R</code>
          </Td>
          <Td>Bibcode</Td>
        </Tr>
        <Tr>
          <Td>
            <code>%nH</code>
          </Td>
          <Td>
            Author, where <code>n</code> can be any number
          </Td>
        </Tr>
        <Tr>
          <Td>
            <code>%q</code>
          </Td>
          <Td>Publication</Td>
        </Tr>
        <Tr>
          <Td>
            <code>%Y</code>
          </Td>
          <Td>Year</Td>
        </Tr>
        <Tr>
          <Td>
            <code>%zm</code>
          </Td>
          <Td>Enumeration</Td>
        </Tr>
      </Tbody>
    </Table>
    <Text>* Any other text will be passed as raw strings</Text>(<strong>default: None</strong>)
  </>
);

const absMaxAuthorstDescription = (
  <>
    Select the default max number of authors shown when exporting in BibTeX ABS (<strong>default: 10</strong>)
  </>
);

const absAuthorCutoffDescription = (
  <>
    If the number of authors in the list is larger than the cutoff, the list will be truncated to the max number
    allowed, otherwise all will be shown. (<strong>default: 200</strong>)
  </>
);

const ExportSettingsPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  // TODO: fetch settings
  // TODO: Change handlers

  const formats = useMemo(() => values(exportFormats), []);

  const handleApplyDefaultExportFormat = ({ id }: ExportFormat) => {
    console.log(id);
  };

  return (
    <SettingsLayout title="Export Settings">
      <Stack direction="column" spacing={5}>
        <DescriptionCollapse body={exportFormatDescription} label="Default Export Format">
          {({ btn, content }) => (
            <FormControl>
              <Select<ExportFormat>
                name="format"
                label={
                  <Box mb="2">
                    <FormLabel htmlFor="default-export-format-selector" fontSize={['sm', 'md']}>
                      {'Default Export Format'} {btn}
                    </FormLabel>
                    {content}
                  </Box>
                }
                hideLabel={false}
                id="default-export-format-selector"
                options={formats}
                value={exportFormats.bibtex}
                onChange={handleApplyDefaultExportFormat}
                stylesTheme="default"
              />
            </FormControl>
          )}
        </DescriptionCollapse>
        <DescriptionCollapse body={customFormatDescription} label="Custom Formats">
          {({ btn, content }) => (
            <FormControl>
              <Box mb="2">
                <FormLabel htmlFor="custom-formats" fontSize={['sm', 'md']}>
                  {'Custom Formats'} {btn}
                </FormLabel>
                {content}
              </Box>
              <Button size="md">Add</Button>
            </FormControl>
          )}
        </DescriptionCollapse>
        <DescriptionCollapse body={bibtexExportFormatDescription} label="BibTeX Default Export Key Format">
          {({ btn, content }) => (
            <FormControl>
              <Box mb="2">
                <FormLabel htmlFor="bibtex-export-format" fontSize={['sm', 'md']}>
                  {'BibTeX Default Export Key Format'} {btn}
                </FormLabel>
                {content}
              </Box>
              <Input placeholder="%1H:%Y:%q" size="md" id="bibtex-export-format" />
            </FormControl>
          )}
        </DescriptionCollapse>
        <JournalFormatSelect
          journalformat={[ExportApiJournalFormat.AASTeXMacros]}
          dispatch={noop}
          label="TeX Journal Name Handling"
          description={journalNameHandlingDescription}
        />
        <MaxAuthorsSlider
          maxauthor={[10]}
          dispatch={noop}
          label="BibTeX Default Export Max Authors"
          description={bibteMaxAuthorsDescription}
        />
        <AuthorCutoffSlider
          authorcutoff={[10]}
          dispatch={noop}
          label="BibTeX Default Author Cutoff"
          description={bibteAuthorCutoffDescription}
        />
        <KeyFormatInput
          keyformat={['']}
          dispatch={noop}
          label="BibTeX ABS Default Export Key Format"
          description={absExportFormatDescription}
        />
        <MaxAuthorsSlider
          maxauthor={[10]}
          dispatch={noop}
          label="BibTeX ABS Default Export Max Authors"
          description={absMaxAuthorstDescription}
        />
        <AuthorCutoffSlider
          authorcutoff={[10]}
          dispatch={noop}
          label="BibTeX ABS Default Author Cutoff"
          description={absAuthorCutoffDescription}
        />
      </Stack>
    </SettingsLayout>
  );
};

export default ExportSettingsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx: GetServerSidePropsContext) => {
  if (!ctx.req.session.isAuthenticated) {
    return Promise.resolve({
      redirect: {
        destination: `/user/account/login?redirectUri=${encodeURIComponent(ctx.req.url)}`,
        permanent: false,
      },
      props: {},
    });
  }

  return Promise.resolve({
    props: {},
  });
}, userGSSP);
