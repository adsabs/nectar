import { ReactElement } from 'react';
import { Box, Button, Collapse, Flex, Stack, StackProps, useDisclosure } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';

export interface IExpandableProps extends StackProps {
  title: string;
  description: string | ReactElement;
}

export const Expandable = ({ title, description, ...stackProps }: IExpandableProps): ReactElement => {
  const { isOpen, onToggle } = useDisclosure();

  const handleToggle = () => {
    onToggle();
  };

  return (
    <Stack direction="column" my={2} gap={1} {...stackProps}>
      <Flex as="a" direction="row" onClick={handleToggle} cursor="pointer">
        {isOpen ? <ChevronDownIcon w={5} h={5} mr={1} /> : <ChevronRightIcon w={5} h={5} mr={1} />}
        <Button variant="link">{title}</Button>
      </Flex>
      <Collapse in={isOpen}>
        <Box pl={6}>{description}</Box>
      </Collapse>
    </Stack>
  );
};
