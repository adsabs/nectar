import { ReactElement, useRef } from 'react';
import { ListType } from './types';
import { useViewport, Viewport } from '@hooks';
import { Box, Flex } from '@chakra-ui/layout';
import { IconButton } from '@chakra-ui/button';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from '@chakra-ui/accordion';
import { OrcidDropdown } from './OrcidDropdown';
import { AccountDropdown } from './AccountDropdown';
import { AboutDropdown } from './AboutDropdown';
import { useDisclosure } from '@chakra-ui/hooks';
import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay } from '@chakra-ui/modal';

export const NavMenus = (): ReactElement => {
  const viewport = useViewport();

  const toggleMenu = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const hamburgerRef = useRef();

  // If viewport is MD or smaller, use vertical menu

  return (
    <Flex justifyContent="end" flexGrow={2}>
      {viewport < Viewport.MD ? (
        <Box justifyContent="end">
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
      ) : (
        <Box display="flex" direction="row" mx={3}>
          {/* Cannot use stack here, will produce warning with popper in menu */}
          <OrcidDropdown type={ListType.DROPDOWN} />
          <AboutDropdown type={ListType.DROPDOWN} />
          <AccountDropdown type={ListType.DROPDOWN} />
        </Box>
      )}
    </Flex>
  );
};
