import { Box, Table, Tbody, Td, Th, Thead, Tooltip, Tr, VisuallyHidden } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { QuestionIcon } from '@chakra-ui/icons';
import { IPapersTableData } from '../types';

export interface IPapersTableProps {
  data: IPapersTableData;
}

export const PapersTable = (props: IPapersTableProps): ReactElement => {
  const { data } = props;

  return (
    <Table width="auto" aria-label="papers table">
      <Thead>
        <Tr>
          <Th>
            <VisuallyHidden>no value</VisuallyHidden>
          </Th>
          <Th>
            <VisuallyHidden>no value</VisuallyHidden>
          </Th>
          <Th>
            <Box>Totals</Box>
          </Th>
          <Th>Refereed</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>Number of papers</Td>
          <Td>
            <Tooltip
              label={
                <span>
                  The total number of papers for which metrics were calculated. This may differ from total number of
                  papers requested due to gaps in the metrics database. If you spot a discrepancy please let us know at
                  adshelp@cfa.harvard.edu
                </span>
              }
            >
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.totalNumberOfPapers[0]}</Td>
          <Td>{data.totalNumberOfPapers[1]}</Td>
        </Tr>
        <Tr>
          <Td>Normalized paper count</Td>
          <Td>
            <Tooltip
              label={
                <span>
                  For a list of N papers (i=1,...N), where N<sub>auth</sub>
                  <sup>i</sup> is the number of authors for publication i, the normalized paper count is the sum over
                  1/N<sub>auth</sub>
                  <sup>i</sup>.
                </span>
              }
            >
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.totalNormalizedPaperCount[0]}</Td>
          <Td>{data.totalNormalizedPaperCount[1]}</Td>
        </Tr>
      </Tbody>
    </Table>
  );
};
