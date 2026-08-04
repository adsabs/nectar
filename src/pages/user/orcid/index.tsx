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
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';

const UserSettings = dynamic(
  () =>
    import('@/components/Orcid/UserSettings').then((m) => ({
      default: m.UserSettings,
    })),
  {
    ssr: false,
    loading: () => <Spinner />,
  },
);
const WorksTable = dynamic(
  () =>
    import('@/components/Orcid/WorksTable').then((m) => ({
      default: m.WorksTable,
    })),
  {
    ssr: false,
    loading: () => <Spinner />,
  },
);

const setOrcidModeSelector = (state: AppState) => state.setOrcidMode;
const orcidModeActiveSelector = (state: AppState) => state.orcid.active;
const touchOrcidActivitySelector = (state: AppState) => state.touchOrcidActivity;
const OrcidPage: NextPage = () => {
  const setOrcidMode = useStore(setOrcidModeSelector);
  const orcidModeActive = useStore(orcidModeActiveSelector);
  const touchOrcidActivity = useStore(touchOrcidActivitySelector);
  const { isOpen, onClose, getButtonProps } = useDisclosure({
    defaultIsOpen: false,
    id: 'orcid-settings-sidebar',
  });
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const hasEnabledOnVisitRef = useRef(false);

  // Turn on orcid mode for this page visit, or touch activity if it's
  // already on. Mount-only (ref guard, not [orcidModeActive]) — otherwise
  // this fires again every time the expiry watcher turns mode off while the
  // user is sitting on this page, instantly re-enabling it and defeating
  // the timeout.
  useEffect(() => {
    if (hasEnabledOnVisitRef.current) {
      return;
    }
    hasEnabledOnVisitRef.current = true;
    if (!orcidModeActive) {
      setOrcidMode(true);
    } else {
      touchOrcidActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            size="xs"
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
