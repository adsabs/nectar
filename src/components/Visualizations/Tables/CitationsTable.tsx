import { QuestionIcon } from '@chakra-ui/icons';
import { Box, Table, Tbody, Td, Th, Thead, Tooltip, Tr, VisuallyHidden } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { ICitationsTableData } from '../types';

export interface ICitationsTableProps {
  data: ICitationsTableData;
  isAbstract: boolean;
}

export const CitationsTable = (props: ICitationsTableProps): ReactElement => {
  const { data, isAbstract } = props;

  return (
    <Table variant="simple" width="auto" aria-label="citations table">
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
        <Tr hidden={isAbstract}>
          <Td>Number of citing papers</Td>
          <Td>
            <Tooltip label="Number of unique papers citing the papers in the submitted list.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.numberOfCitingPapers[0]}</Td>
          <Td hidden={isAbstract}>{data.numberOfCitingPapers[1]}</Td>
        </Tr>
        <Tr>
          <Td>Total citations</Td>
          <Td>
            <Tooltip label="The total number of times all papers in the list were cited.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.totalCitations[0]}</Td>
          <Td hidden={isAbstract}>{data.totalCitations[1]}</Td>
        </Tr>
        <Tr hidden={isAbstract}>
          <Td>Number of self-citations</Td>
          <Td>
            <Tooltip label="The number of citing papers that were also in the list from which the metrics were computed.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.numberOfSelfCitations[0]}</Td>
          <Td>{data.numberOfSelfCitations[1]}</Td>
        </Tr>

        <Tr hidden={isAbstract}>
          <Td>Average citations</Td>
          <Td>
            <Tooltip label="The total number of citations divided by the number of papers.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.averageCitations[0]}</Td>
          <Td>{data.averageCitations[1]}</Td>
        </Tr>
        <Tr hidden={isAbstract}>
          <Td>Median citations</Td>
          <Td>
            <Tooltip label="The median of the citation distribution.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.medianCitations[0]}</Td>
          <Td>{data.medianCitations[1]}</Td>
        </Tr>

        <Tr>
          <Td>Normalized citations</Td>
          <Td>
            <Tooltip
              label={
                <div>
                  For a list of N papers (i=1,...N), where N<sub>auth</sub>
                  <sup>i</sup> is the number of authors for publication i and C<sub>i</sub> the number of citations that
                  this paper received, the normalized citation count for each article is C<sub>i</sub>/N
                  <sub>auth</sub>
                  <sup>i</sup> ,and the &#39;normalized citations&#39; for this list of N papers is the sum of these N
                  numbers.
                </div>
              }
            >
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.normalizedCitations[0]}</Td>
          <Td hidden={isAbstract}>{data.normalizedCitations[1]}</Td>
        </Tr>

        <Tr>
          <Td>Refereed citations</Td>
          <Td>
            <Tooltip label="Number of refereed citing papers.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.refereedCitations[0]}</Td>
          <Td hidden={isAbstract}>{data.refereedCitations[1]}</Td>
        </Tr>
        <Tr hidden={isAbstract}>
          <Td>Average refereed citations</Td>
          <Td>
            <Tooltip label="The average number of citations from refereed publications to all/refereed publications in the list.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.averageRefereedCitations[0]}</Td>
          <Td>{data.averageRefereedCitations[1]}</Td>
        </Tr>

        <Tr hidden={isAbstract}>
          <Td>Median refereed citations</Td>
          <Td>
            <Tooltip label="The average median of citations from refereed publications to all refereed publications in the list.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.medianRefereedCitations[0]}</Td>
          <Td>{data.medianRefereedCitations[1]}</Td>
        </Tr>
        <Tr>
          <Td>Normalized refereed citations</Td>
          <Td>
            <Tooltip label="The normalized number of citations from refereed publications to all refereed publications in the list.">
              <QuestionIcon />
            </Tooltip>
          </Td>
          <Td>{data.normalizedRefereedCitations[0]}</Td>
          <Td hidden={isAbstract}>{data.normalizedRefereedCitations[1]}</Td>
        </Tr>
      </Tbody>
    </Table>
  );
};
