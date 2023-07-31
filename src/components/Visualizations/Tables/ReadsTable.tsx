import { Box, Table, Tbody, Td, Th, Thead, Tooltip, Tr, VisuallyHidden } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { QuestionIcon } from '@chakra-ui/icons';
import { IReadsTableData } from '../types';

export interface IReadsTableProps {
  data: IReadsTableData;
  isAbstract: boolean;
}

export const ReadsTable = (props: IReadsTableProps): ReactElement => {
  const { data, isAbstract } = props;

  return (
    <Table width="auto" aria-label="reads table">
      <Thead>
        <Tr>
          <Th>
            <VisuallyHidden>no value</VisuallyHidden>
          </Th>
          <Th>
            <VisuallyHidden>no value</VisuallyHidden>
          </Th>
          <Th>
            <Box hidden={isAbstract}>Totals</Box>
          </Th>
          <Th hidden={isAbstract}>Refereed</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>Total number of reads</Td>
          <Td>
            <Tooltip label="The total number of times all papers were read. For each paper, a read is counted if an ADS user runs a search in our system and then requests to either view the paper's full bibliographic record or download the fulltext.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.totalNumberOfReads[0]}</Td>
          <Td hidden={isAbstract}>{data.totalNumberOfReads[1]}</Td>
        </Tr>
        <Tr hidden={isAbstract}>
          <Td>Average number of reads</Td>
          <Td>
            <Tooltip label="The total number of reads divided by the number of papers.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.averageNumberOfReads[0]}</Td>
          <Td hidden={isAbstract}>{data.averageNumberOfReads[1]}</Td>
        </Tr>
        <Tr hidden={isAbstract}>
          <Td>Median number of reads</Td>
          <Td>
            <Tooltip label="The median of the reads distribution.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.medianNumberOfReads[0]}</Td>
          <Td hidden={isAbstract}>{data.medianNumberOfReads[1]}</Td>
        </Tr>

        <Tr>
          <Td>Total number of downloads</Td>
          <Td>
            <Tooltip label="The total number of times full text (article or e-print) was accessed.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.totalNumberOfDownloads[0]}</Td>
          <Td hidden={isAbstract}>{data.totalNumberOfDownloads[1]}</Td>
        </Tr>
        <Tr hidden={isAbstract}>
          <Td>Average number of downloads</Td>
          <Td>
            <Tooltip label="The total number of downloads divided by the number of papers.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.averageNumberOfDownloads[0]}</Td>
          <Td hidden={isAbstract}>{data.averageNumberOfDownloads[1]}</Td>
        </Tr>

        <Tr hidden={isAbstract}>
          <Td>Median number of downloads</Td>
          <Td>
            <Tooltip label="The median of the downloads distribution.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.medianNumberOfDownloads[0]}</Td>
          <Td hidden={isAbstract}>{data.medianNumberOfDownloads[1]}</Td>
        </Tr>
      </Tbody>
    </Table>
  );
};
