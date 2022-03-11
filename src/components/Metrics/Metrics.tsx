import { IADSApiMetricsResponse } from '@api';
import { Box, Heading } from '@chakra-ui/layout';
import { useMetrics } from '@hooks/useMetrics';
import { ReactElement } from 'react';
import { CitationsTable } from './CitationsTable';
import { ReadsTable } from './ReadsTable';
export interface IMetricsProps {
  metrics: IADSApiMetricsResponse;
  isAbstract: boolean;
}

export const Metrics = (props: IMetricsProps): ReactElement => {
  const { metrics, isAbstract } = props;

  const { citationsTable, readsTable } = useMetrics(metrics);

  return (
    <>
      {citationsTable ? (
        <Box as="section">
          <Heading as="h3" fontSize="2xl" fontWeight="light" backgroundColor="gray.50" p={3}>
            Citations
          </Heading>
          <CitationsTable data={citationsTable} isAbstract={isAbstract} />
        </Box>
      ) : null}
      {readsTable ? (
        <Box as="section">
          <Heading as="h3" fontSize="2xl" fontWeight="light" backgroundColor="gray.50" p={3}>
            Reads
          </Heading>
          <ReadsTable data={readsTable} isAbstract={isAbstract} />
        </Box>
      ) : null}
    </>
  );
};
