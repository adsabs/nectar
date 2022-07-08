import { ReactElement, useState } from 'react';
import { Box, Collapse, Flex, Stack, StackProps, Text } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';

export interface IExpandableProps extends StackProps {
  title: string;
  description: string | ReactElement;
}

export const Expandable = ({ title, description, ...stackProps }: IExpandableProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenClose = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Stack direction="column" my={5} gap={1} {...stackProps}>
      <Flex as="button" direction="row" onClick={handleOpenClose} color="blue.500" cursor="pointer">
        {isOpen ? <ChevronDownIcon w={5} h={5} mr={1} /> : <ChevronRightIcon w={5} h={5} mr={1} />}
        <Text>{title}</Text>
      </Flex>
      <Collapse in={isOpen}>
        <Box pl={6}>{description}</Box>
      </Collapse>
    </Stack>
  );
};
