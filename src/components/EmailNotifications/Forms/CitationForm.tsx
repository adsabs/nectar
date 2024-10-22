import { CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import { noop } from '@/utils/common/noop';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { INotification } from '@/api/vault/types';
import { useAddNotification, useEditNotification } from '@/api/vault/vault';

type Author = { author: string; type: 'Author' | 'Orcid' };

export const CitationForm = ({
  onClose,
  onUpdated = noop,
  template,
  notification,
}: {
  onClose: () => void;
  onUpdated?: () => void;
  template?: 'citations' | 'authors';
  notification?: INotification;
}) => {
  const toast = useToast({ duration: 2000 });

  const [authors, setAuthors] = useState<Author[]>([]);

  const [name, setName] = useState<string>(notification?.name ?? '');

  // init authors if edit existing
  useEffect(() => {
    if (notification) {
      const list = notification.data?.split(/ [oO][Rr] /).map((item) => {
        const parts = item.trim().split(':');
        if (parts[0].trim().toLowerCase() === 'author') {
          return { author: parts[1].trim().replace(/^"(.+)"$/, '$1'), type: 'Author' as Author['type'] };
        } else {
          return { author: parts[1].trim().replace(/^"(.+)"$/, '$1'), type: 'Orcid' as Author['type'] };
        }
      });
      setAuthors(list ?? []);
    }
  }, [notification]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  // New author row being added
  const [newAuthorName, setNewAuthorName] = useState<string>(null);

  const isValidName = (author: string) => author && author.match(/^[^,]+,[^,]+$/);

  const isValidOrcid = (author: string) => author && author.match(/^\d{4}-?\d{4}-?\d{4}-?\d{3}[X\d]$/);

  const newAuthorNameIsValid = isValidName(newAuthorName) || isValidOrcid(newAuthorName);

  const newAuthorNameRef = useRef<HTMLInputElement>();

  const newAuthorType: '' | 'Invalid' | Author['type'] =
    !newAuthorName || newAuthorName.length === 0
      ? ''
      : isValidName(newAuthorName)
      ? 'Author'
      : isValidOrcid(newAuthorName)
      ? 'Orcid'
      : 'Invalid';

  const { mutate: addNotification, isLoading: isAdding } = useAddNotification();

  const { mutate: editNofication, isLoading: isEditing } = useEditNotification();

  const handleNewAuthorNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthorName(e.target.value);
  };

  // Author should already be validated when this is called
  const handleAddAuthor = () => {
    setAuthors((prev) => [...prev, { author: newAuthorName, type: isValidName(newAuthorName) ? 'Author' : 'Orcid' }]);
    // clear input fields
    setNewAuthorName(null);
    newAuthorNameRef.current.focus();
  };

  const handleDeleteAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setAuthors((prev) => prev.filter((e, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!!notification) {
      // edit existing
      editNofication(
        {
          id: notification.id,
          data: authors.map((a) => `${a.type === 'Author' ? 'author' : 'orcid'}:"${a.author}"`).join(' OR '),
          name,
        },
        {
          onSettled(data, error) {
            if (error) {
              toast({ status: 'error', title: 'Error', description: parseAPIError(error) });
            } else {
              toast({ status: 'success', title: 'Notification Modified' });
              onClose();
              onUpdated();
            }
          },
        },
      );
    } else {
      // add new
      addNotification(
        {
          data: authors.map((a) => `${a.type === 'Author' ? 'author' : 'orcid'}:"${a.author}"`).join(' OR '),
          template: template,
          type: 'template',
        },
        {
          onSettled(data, error) {
            if (error) {
              toast({ status: 'error', title: 'Error', description: parseAPIError(error) });
            } else {
              toast({ status: 'success', title: 'Notification Created' });
              onClose();
              onUpdated();
            }
          },
        },
      );
    }
  };

  // Row for adding new author
  const newAuthorTableRow = (
    <Tr>
      <Td>
        <Input
          size="sm"
          onChange={handleNewAuthorNameChange}
          value={newAuthorName ?? ''}
          ref={newAuthorNameRef}
          placeholder="Last, First M. or 1111-2222-3333-4444"
          autoFocus
          onKeyUp={(e) => {
            if (newAuthorNameIsValid && e.key === 'Enter') {
              handleAddAuthor();
            }
          }}
          data-testid="new-author-input"
          aria-label="new author input"
        />
      </Td>
      <Td>{newAuthorType}</Td>
      <Td>
        <IconButton
          aria-label="add author"
          icon={<CheckIcon />}
          variant="outline"
          colorScheme="green"
          isDisabled={!newAuthorNameIsValid}
          onClick={handleAddAuthor}
        />
      </Td>
    </Tr>
  );

  return (
    <Flex direction="column" gap={4} data-testid="create-citations-modal">
      <Text fontSize="larger">Weekly updates on the latest citations to your papers or those by any other authors</Text>
      {notification && (
        <FormControl>
          <FormLabel>Notification Name</FormLabel>
          <Input value={name} onChange={handleNameChange} autoFocus />
        </FormControl>
      )}
      <Table data-testid="authors-list-table">
        <Thead>
          <Tr>
            <Th>Author (Name or ORCiD)</Th>
            <Th>Type</Th>
            <Th w="10%">Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {authors.map((row, index) => (
            <Tr key={row.author}>
              <Td>{row.author}</Td>
              <Td>{row.type}</Td>
              <Td>
                <IconButton
                  aria-label="delete"
                  icon={<DeleteIcon />}
                  variant="outline"
                  colorScheme="red"
                  data-index={index}
                  onClick={handleDeleteAuthor}
                />
              </Td>
            </Tr>
          ))}
          {newAuthorTableRow}
        </Tbody>
      </Table>
      <HStack mt={4} justifyContent="end">
        <Button isDisabled={authors.length === 0} isLoading={isAdding || isEditing} onClick={handleSubmit}>
          Submit
        </Button>
        <Button variant="outline" onClick={onClose} type="button">
          Cancel
        </Button>
      </HStack>
    </Flex>
  );
};
