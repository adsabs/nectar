import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
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

export const NavMenus = (): ReactElement => {
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
      window.open('/scixhelp', '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <Flex justifyContent="end">
      <Box display={{ lg: 'none' }} justifyContent="end">
        <LightMode>
          <IconButton
            aria-label="menu"
            icon={<HamburgerIcon />}
            colorScheme="black"
            size="lg"
            onClick={toggleMenu}
            ref={hamburgerRef}
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
                  <AccordionButton onClick={handleHelp}>
                    <Box flex="1" textAlign="left" fontWeight="medium">
                      Help
                    </Box>
                  </AccordionButton>
                </AccordionItem>
              </Accordion>
              <ColorModeMenu type="switch" />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
      <Box display={{ base: 'none', lg: 'flex' }} flexDirection="row" mx={3} alignItems="center">
        {/* Cannot use stack here, will produce warning with popper in menu */}
        <FeedbackDropdown type={ListType.DROPDOWN} />
        <OrcidDropdown type={ListType.DROPDOWN} />
        <AboutDropdown type={ListType.DROPDOWN} />
        <Menu variant="navbar">
          <MenuButton onClick={handleHelp} onKeyDown={(e) => (e.key === 'Enter' ? handleHelp() : noop())}>
            Help
          </MenuButton>
        </Menu>
        <AccountDropdown type={ListType.DROPDOWN} />
        <ColorModeMenu type="icon" />
      </Box>
    </Flex>
  );
};
