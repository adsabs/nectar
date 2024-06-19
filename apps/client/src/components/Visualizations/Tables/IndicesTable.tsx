import { Box, Table, Tbody, Td, Th, Thead, Tooltip, Tr, VisuallyHidden } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { QuestionIcon } from '@chakra-ui/icons';
import { IIndicesTableData } from '../types';

export interface IIndicesTableProps {
  data: IIndicesTableData;
}

export const IndicesTable = (props: IIndicesTableProps): ReactElement => {
  const { data } = props;

  return (
    <Table width="auto" aria-label="Indices table">
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
          <Td>h-index</Td>
          <Td>
            <Tooltip label="The H-index is the largest number H such that H publications have at least H citations.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.hIndex[0]}</Td>
          <Td>{data.hIndex[1]}</Td>
        </Tr>
        <Tr>
          <Td>m-index</Td>
          <Td>
            <Tooltip label="The m-index is defined as the h-index divided by number of years since the first published paper of the scientist (also called m-quotient).">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.mIndex[0]}</Td>
          <Td>{data.mIndex[1]}</Td>
        </Tr>
        <Tr>
          <Td>g-index</Td>
          <Td>
            <Tooltip label="Given a set of articles ranked in decreasing order of the number of citations that they received, the g-index is the (unique) largest number such that the top g articles received (together) at least g<sup>2</sup> citations.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.gIndex[0]}</Td>
          <Td>{data.gIndex[1]}</Td>
        </Tr>
        <Tr>
          <Td>i10-index</Td>
          <Td>
            <Tooltip label="The i10-index is the number of publications with at least 10 citations.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.i10Index[0]}</Td>
          <Td>{data.i10Index[1]}</Td>
        </Tr>
        <Tr>
          <Td>i100-index</Td>
          <Td>
            <Tooltip label="The i100-index is the number of publications with at least 100 citations.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.i100Index[0]}</Td>
          <Td>{data.i100Index[1]}</Td>
        </Tr>
        <Tr>
          <Td>tori-index</Td>
          <Td>
            <Tooltip label="The tori-index is calculated using the reference lists of the citing papers, where self-citations are removed. The contribution of each citing paper is then normalized by the number of remaining references in the citing papers and the number of authors in the cited paper.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.toriIndex[0]}</Td>
          <Td>{data.toriIndex[1]}</Td>
        </Tr>
        <Tr>
          <Td>riq-index</Td>
          <Td>
            <Tooltip label="The riq-index equals the square root of the tori-index, divided by the time between the first and last publication. A multiplication with 1000 has been applied.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.riqIndex[0]}</Td>
          <Td>{data.riqIndex[1]}</Td>
        </Tr>
        <Tr>
          <Td>read10-index</Td>
          <Td>
            <Tooltip label="Read10 is the current readership rate for all an individual's papers published in the most recent ten years, normalized for number of authors.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.read10Index[0]}</Td>
          <Td>{data.read10Index[1]}</Td>
        </Tr>
      </Tbody>
    </Table>
  );
};
