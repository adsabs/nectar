import { Grid, GridItem, Skeleton, Stack } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { ExportContainer } from './ExportContainer';

export const ExportSkeleton = (): ReactElement => {
  return (
    <ExportContainer header={<Skeleton height="20px" width="240px" />} isLoading>
      <Grid templateColumns={{ base: 'auto', md: 'repeat(2, 1fr)' }} gap={4}>
        <GridItem>
          <Stack spacing={4}>
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="36px" />
            <Skeleton height="40px" />
          </Stack>
        </GridItem>
        <GridItem>
          <Skeleton height="240px" />
        </GridItem>
      </Grid>
    </ExportContainer>
  );
};
