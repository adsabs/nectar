import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  IconButton,
  LightMode,
  Menu,
  MenuButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { ReactElement, useRef } from 'react';
import { AboutDropdown } from './AboutDropdown';
import { AccountDropdown } from './AccountDropdown';
import { FeedbackDropdown } from './FeedbackDropdown';
import { OrcidDropdown } from './OrcidDropdown';
import { ListType } from './types';
import { ColorModeMenu } from './ColorModeMenu';
import { isBrowser } from '@/utils/common/guards';
import { noop } from '@/utils/common/noop';
import { useTour } from './useTour';
import { useRouter } from 'next/router';
import { useScreenSize } from '@/lib/useScreenSize';

export const NavMenus = (): ReactElement => {
  const { tourType, tour } = useTour();
  const router = useRouter();
  const toast = useToast();
  const { isScreenLarge } = useScreenSize();

  const toggleMenu = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const hamburgerRef = useRef();

  const handleHelp = () => {
    if (isBrowser()) {
      window.open('/scixhelp', '_blank', 'noopener');
      onClose();
    }
  };

  const handleStartTour = () => {
    if (isOpen) {
      onClose();
    }
    if (tourType === 'home' && router.pathname !== '/') {
      router.push('/').then(() => {
        tour.start();
      });
    } else if (tourType === 'results' && !document.querySelector('#tour-search-facets')) {
      toast({
        title: 'How to use tour',
        description: 'Try a search with more than one result to start the tour.',
        status: 'warning',
      });
    } else if (tourType !== 'none') {
      tour.start();
    } else {
      toast({
        title: 'How to use tour',
        description:
          'You can start the tour at the landing page, search results page, or abstract page. Then click "Tour" again.',
        status: 'warning',
      });
    }
  };

  return (
    <Flex justifyContent="end">
      {!isScreenLarge ? (
        <Box justifyContent="end">
          <LightMode>
            <IconButton
              aria-label="menu"
              icon={<HamburgerIcon />}
              colorScheme="black"
              size="lg"
              onClick={toggleMenu}
              ref={hamburgerRef}
              data-id="tour-main-menu"
            />
          </LightMode>
          <Drawer variant="navbar" isOpen={isOpen} placement="right" onClose={onClose} finalFocusRef={hamburgerRef}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader />
              <DrawerBody>
                <Accordion allowMultiple defaultIndex={[0]}>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        Account
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <AccountDropdown type={ListType.ACCORDION} onFinished={onClose} />
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        Feedback
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <FeedbackDropdown type={ListType.ACCORDION} onFinished={onClose} />
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        Orcid
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <OrcidDropdown type={ListType.ACCORDION} onFinished={onClose} />
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        About
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <AboutDropdown type={ListType.ACCORDION} onFinished={onClose} />
                    </AccordionPanel>
                  </AccordionItem>
                  <AccordionItem>
                    <AccordionButton onClick={handleHelp} id="help-pages">
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        Help
                      </Box>
                    </AccordionButton>
                  </AccordionItem>
                  <AccordionItem>
                    <AccordionButton onClick={handleStartTour}>
                      <Box flex="1" textAlign="left" fontWeight="medium">
                        Tour
                      </Box>
                    </AccordionButton>
                  </AccordionItem>
                </Accordion>
                <ColorModeMenu type="switch" />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </Box>
      ) : (
        <Flex flexDirection="row" mx={3} alignItems="center">
          {/* Cannot use stack here, will produce warning with popper in menu */}
          <Button mx={2} onClick={handleStartTour}>
            Tour
          </Button>
          <FeedbackDropdown type={ListType.DROPDOWN} />
          <OrcidDropdown type={ListType.DROPDOWN} />
          <AboutDropdown type={ListType.DROPDOWN} />
          <Menu variant="navbar">
            <MenuButton
              onClick={handleHelp}
              onKeyDown={(e) => (e.key === 'Enter' ? handleHelp() : noop())}
              data-id="tour-help-menu"
            >
              Help
            </MenuButton>
          </Menu>
          <AccountDropdown type={ListType.DROPDOWN} />
          <ColorModeMenu type="icon" />
        </Flex>
      )}
    </Flex>
  );
};
