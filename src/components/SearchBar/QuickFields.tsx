import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Code,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  usePopper,
} from '@chakra-ui/react';
import { useState } from 'react';
import { MouseEvent, ReactElement } from 'react';
import { allSearchTerms, ISearchTermOption } from './models';

export interface IQuickFieldsProps {
  onSelect: (value: string) => void;
}

const quickfields = [
  allSearchTerms.fields.author,
  allSearchTerms.fields['first-author'],
  allSearchTerms.fields.abs,
  allSearchTerms.fields.year,
  allSearchTerms.fields.full,
];

export const QuickFields = ({ onSelect }: IQuickFieldsProps): ReactElement => {
  const handleQFSelect = (e: MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    onSelect(target.dataset['value']);
  };

  const handleASTSelect = (value: string) => {
    onSelect(value);
  };

  return (
    <Flex direction="row" justifyContent="start" fontSize="md" gap={5}>
      <HStack spacing={5} fontSize="md" display={{ base: 'none', sm: 'flex' }}>
        <Text>QUICK FIELD: </Text>
        {quickfields.map((term) => (
          <Button key={term.id} onClick={handleQFSelect} variant="link" tabIndex={0} data-value={term.value} size="md">
            {term.title}
          </Button>
        ))}
      </HStack>
      <AllSearchTerms onSelect={handleASTSelect} />
    </Flex>
  );
};

const AllSearchTerms = ({ onSelect }: { onSelect: (value: string) => void }): ReactElement => {
  const [showTooltipFor, setShowTooltipFor] = useState<ISearchTermOption>(null);
  const { popperRef, referenceRef } = usePopper({
    placement: 'right-start',
  });

  const handleClose = () => {
    // give it some time to handle user click inside tooltip (links)
    // before closing the tooltips
    setTimeout(() => setShowTooltipFor(null), 10);
  };

  const handleSelectAllSearchTerms = (e: MouseEvent<HTMLElement>) => {
    setShowTooltipFor(null);
    const target = e.currentTarget as HTMLElement;
    const value = target.getAttribute('value');
    onSelect(value);
  };

  const handleToolTip = (option: ISearchTermOption) => {
    setShowTooltipFor(option);
  };

  return (
    <>
      <Menu onClose={handleClose} isLazy={false}>
        <MenuButton as={Button} variant="outline" rightIcon={<ChevronDownIcon />}>
          All Search Terms
        </MenuButton>
        <MenuList h="400px" overflow="scroll" zIndex="10" ref={referenceRef}>
          {Object.entries(allSearchTerms).map(([group, options]) => (
            <MenuGroup title={group} fontWeight="bold" fontSize="lg">
              {Object.values(options).map((option) => (
                <MenuItem
                  key={option.id}
                  onClick={handleSelectAllSearchTerms}
                  value={option.value}
                  fontSize="md"
                  onMouseEnter={() => handleToolTip(option)}
                >
                  {option.title}
                </MenuItem>
              ))}
            </MenuGroup>
          ))}
        </MenuList>
      </Menu>
      {showTooltipFor && (
        <Box
          ref={popperRef}
          bg="white"
          borderColor="gray.200"
          borderWidth={1}
          borderRadius={5}
          w={300}
          zIndex={10}
          m={5}
        >
          <Text color="gray.900" fontWeight="bold" backgroundColor="gray.100" p={2}>
            {showTooltipFor.title}
          </Text>
          <Text p={2} dangerouslySetInnerHTML={{ __html: showTooltipFor.description }} />
          <Text p={2}>
            Syntax:
            {showTooltipFor.syntax.map((s) => (
              <span key={s}>
                <br />
                <Code>{s}</Code>
              </span>
            ))}
          </Text>
          <Text p={2}>
            Example:
            {showTooltipFor.example.map((e) => (
              <span key={e}>
                <br />
                <Code>{e}</Code>
              </span>
            ))}
          </Text>
        </Box>
      )}
    </>
  );
};
