import { NextPage } from 'next';
import { Grid, GridItem, Spinner, useBreakpointValue } from '@chakra-ui/react';
import { AppState, useStore } from '@store';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const UserSettings = dynamic(() => import('@components/Orcid/UserSettings').then((m) => m.UserSettings), {
  ssr: false,
  loading: () => <Spinner />,
});
const WorksTable = dynamic(() => import('@components/Orcid/WorksTable').then((m) => m.WorksTable), {
  ssr: false,
  loading: () => <Spinner />,
});

const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;
const orcidModeActiveSelector = (state: AppState) => state.orcid.active;
const OrcidPage: NextPage = () => {
  const setOrcidMode = useStore(setOrcidModeSelector);
  const orcidModeActive = useStore(orcidModeActiveSelector);

  const mobile = useBreakpointValue({ base: true, lg: false });

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
