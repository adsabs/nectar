import { NextPage } from 'next';
import { UserSettings, WorksTable } from '@components/Orcid';
import { Grid, GridItem, useBreakpointValue } from '@chakra-ui/react';

const OrcidPage: NextPage = () => {
  const mobile = useBreakpointValue({ base: true, lg: false }, { ssr: false });

  return (
    <>
      {mobile ? (
        <>
          <UserSettings />
          <WorksTable />
        </>
      ) : (
        <Grid templateColumns="repeat(4, 1fr)" gap={6} my={{ base: 2, lg: 10 }}>
          <GridItem colSpan={1}>
            <UserSettings />
          </GridItem>
          <GridItem colSpan={3}>
            <WorksTable />
          </GridItem>
        </Grid>
      )}
    </>
  );
};

export default OrcidPage;
