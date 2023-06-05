import { NextPage } from 'next';
import { UserSettings, WorksTable } from '@components/Orcid';
import { Grid, GridItem, useBreakpointValue } from '@chakra-ui/react';
import { AppState, useStore } from '@store';
import { useEffect } from 'react';

const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;
const orcidModeActiveSelector = (state: AppState) => state.orcid.active;
const OrcidPage: NextPage = () => {
  const setOrcidMode = useStore(setOrcidModeSelector);
  const orcidModeActive = useStore(orcidModeActiveSelector);

  const mobile = useBreakpointValue({ base: true, lg: false }, { ssr: false });

  // if navigating to this page, turn on orcid mode
  useEffect(() => {
    if (!orcidModeActive) {
      setOrcidMode(true);
    }
  }, [orcidModeActive]);

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
