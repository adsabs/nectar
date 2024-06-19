import { Table, TableCaption, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { SimpleLink } from '@/components/SimpleLink';

export const exportFormatDescription = (
  <>
    Select the default export format you would like to use when opening the Export tool. (
    <strong>default: BibTeX</strong>)
  </>
);

export const customFormatDescription = (
  <>
    Edit your saved custom formats. Check out our{' '}
    <SimpleLink href={'/help/actions/export'} newTab display="inline">
      docs
    </SimpleLink>{' '}
    for more information.
  </>
);

export const exportFormatTable = (
  <>
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

export const bibtexExportFormatDescription = (
  <>
    Select the default key format when exporting in BibTeX (
    <SimpleLink href="/help/actions/export" newTab display="inline">
      Learn More
    </SimpleLink>
    ){exportFormatTable}
  </>
);

export const journalNameHandlingDescription = (
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

export const absExportFormatDescription = (
  <>
    Select the default key format when exporting in BibTeX ABS (
    <SimpleLink href="/help/actions/export" newTab display="inline">
      Learn More
    </SimpleLink>
    ){exportFormatTable}
  </>
);

export const maxAuthorDescription = (
  <>
    If the number of authors in the list is larger than the cutoff, the list will be truncated to the max number
    allowed, otherwise all will be shown.
  </>
);
