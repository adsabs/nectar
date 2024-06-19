import { NextPage } from 'next';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  Grid,
  GridItem,
  Spinner,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { AppState, useStore } from '@/store';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';

const UserSettings = dynamic(() => import('@/components/Orcid/UserSettings').then((m) => m.UserSettings), {
  ssr: false,
  loading: () => <Spinner />,
});
const WorksTable = dynamic(() => import('@/components/Orcid/WorksTable').then((m) => m.WorksTable), {
  ssr: false,
  loading: () => <Spinner />,
});

const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;
const orcidModeActiveSelector = (state: AppState) => state.orcid.active;
const OrcidPage: NextPage = () => {
  const setOrcidMode = useStore(setOrcidModeSelector);
  const orcidModeActive = useStore(orcidModeActiveSelector);
  const { isOpen, onClose, getButtonProps } = useDisclosure({
    defaultIsOpen: false,
    id: 'orcid-settings-sidebar',
  });
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // if navigating to this page, turn on orcid mode
  useEffect(() => {
    if (!orcidModeActive) {
      setOrcidMode(true);
    }
  }, [orcidModeActive]);

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME_FULL} My ORCiD Page`}</title>
      </Head>
      {isMobile ? (
        <Box py="4">
          <Drawer
            isOpen={isOpen}
            onClose={onClose}
            autoFocus
            placement="left"
            returnFocusOnClose
            trapFocus
            onOverlayClick={onClose}
            size="full"
          >
            <DrawerContent>
              <DrawerHeader>
                <DrawerCloseButton />
              </DrawerHeader>
              <DrawerBody>
                <UserSettings />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
          <Button display="inline" variant="outline" {...getButtonProps()}>
            Show settings
          </Button>
          <WorksTable />
        </Box>
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

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
