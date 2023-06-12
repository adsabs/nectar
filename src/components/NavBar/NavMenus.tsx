import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from '@chakra-ui/accordion';
import { IconButton } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Box, Flex } from '@chakra-ui/layout';
import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay } from '@chakra-ui/modal';
import { ReactElement, useRef } from 'react';
import { AboutDropdown } from './AboutDropdown';
import { AccountDropdown } from './AccountDropdown';
import { FeedbackDropdown } from './FeedbackDropdown';
import { OrcidDropdown } from './OrcidDropdown';
import { ListType } from './types';

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

  return (
    <Flex justifyContent="end">
      <Box display={{ md: 'none' }} justifyContent="end">
        <IconButton
          aria-label="menu"
          icon={<HamburgerIcon />}
          colorScheme="black"
          size="lg"
          onClick={toggleMenu}
          ref={hamburgerRef}
        />
        <Drawer variant="navbar" isOpen={isOpen} placement="right" onClose={onClose} finalFocusRef={hamburgerRef}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader></DrawerHeader>
            <DrawerBody>
              <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
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
              </Accordion>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
      <Box display={{ base: 'none', md: 'flex' }} flexDirection="row" mx={3}>
        {/* Cannot use stack here, will produce warning with popper in menu */}
        <FeedbackDropdown type={ListType.DROPDOWN} />
        <OrcidDropdown type={ListType.DROPDOWN} />
        <AboutDropdown type={ListType.DROPDOWN} />
        <AccountDropdown type={ListType.DROPDOWN} />
      </Box>
    </Flex>
  );
};
