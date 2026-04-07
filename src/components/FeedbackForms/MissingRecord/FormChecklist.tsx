import { Box, HStack, List, ListItem, Text } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useFormContext, useWatch } from 'react-hook-form';
import { isNonEmptyString } from 'ramda-adjunct';
import { isValidEmail } from '@/utils/common/isValidEmail';
import { FormValues } from './types';

interface ChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
}

export function FormChecklist() {
  const { control } = useFormContext<FormValues>();

  const [name, email, title, publication, pubDate, authors, noAuthors] = useWatch<
    FormValues,
    ['name', 'email', 'title', 'publication', 'pubDate', 'authors', 'noAuthors']
  >({
    control,
    name: ['name', 'email', 'title', 'publication', 'pubDate', 'authors', 'noAuthors'],
  });

  const items: ChecklistItem[] = [
    { id: 'name', label: 'Name', isComplete: isNonEmptyString(name) },
    { id: 'email', label: 'Email', isComplete: !!email && isValidEmail(email) },
    { id: 'title', label: 'Title', isComplete: isNonEmptyString(title) },
    {
      id: 'authors',
      label: 'Author(s)',
      isComplete: (authors?.length ?? 0) > 0 || noAuthors === true,
    },
    { id: 'publication', label: 'Publication', isComplete: isNonEmptyString(publication) },
    { id: 'pubDate', label: 'Publication Date', isComplete: isNonEmptyString(pubDate) },
  ];

  const completedCount = items.filter((i) => i.isComplete).length;

  return (
    <Box borderWidth="1px" borderRadius="md" p={4} minW="200px">
      <Text fontWeight="semibold" fontSize="sm" mb={2}>
        Required Fields
      </Text>
      <Text fontSize="xs" color="gray.500" mb={3}>
        {completedCount} of {items.length}
      </Text>
      <List spacing={2} role="list">
        {items.map((item) => (
          <ListItem
            key={item.id}
            data-testid={`checklist-${item.id}`}
            data-complete={String(item.isComplete)}
            role="listitem"
          >
            <HStack spacing={2}>
              <CheckCircleIcon
                color={item.isComplete ? 'green.500' : 'gray.300'}
                aria-label={item.isComplete ? 'complete' : 'incomplete'}
              />
              <Text fontSize="sm" color={item.isComplete ? 'inherit' : 'gray.500'}>
                {item.label}
              </Text>
            </HStack>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
