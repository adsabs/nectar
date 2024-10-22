import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { isValidKeyword } from './Utils';
import { useDebounce } from '@/lib/useDebounce';
import { noop } from '@/utils/common/noop';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { INotification } from '@/api/vault/types';
import { useAddNotification, useEditNotification } from '@/api/vault/vault';

export const KeywordsForm = ({
  onClose,
  onUpdated = noop,
  notification,
}: {
  onClose: () => void;
  onUpdated?: () => void;
  notification?: INotification;
}) => {
  const toast = useToast({ duration: 2000 });

  const [keywords, setKeywords] = useState(notification?.data ?? '');

  const dbKeywords = useDebounce(keywords);

  const [name, setName] = useState<string>(notification?.name ?? '');

  const { mutate: addNotification, isLoading: isAdding } = useAddNotification();

  const { mutate: editNofication, isLoading: isEditing } = useEditNotification();

  const { kwValid, kwErrorMessage } = useMemo(() => {
    const isValid = isValidKeyword(dbKeywords);
    return {
      kwValid: isValid,
      kwErrorMessage: isValid ? null : 'Invalid keyword syntax',
    };
  }, [dbKeywords]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleKeywordsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeywords(e.target.value);
  };

  const handleAddNotification = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!!notification) {
      // edit existing
      editNofication(
        {
          id: notification.id,
          data: keywords,
          name,
        },
        {
          onSettled(data, error) {
            if (error) {
              toast({
                status: 'error',
                title: 'Error',
                description: parseAPIError(error),
              });
            } else {
              toast({ status: 'success', title: 'Notification Modified' });
              onClose();
              onUpdated();
            }
          },
        },
      );
    } else {
      addNotification(
        {
          type: 'template',
          template: 'keyword',
          data: keywords,
        },
        {
          onSettled(data, error) {
            if (error) {
              toast({
                status: 'error',
                title: 'Error',
                description: parseAPIError(error),
              });
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

  return (
    <form onSubmit={handleAddNotification}>
      <Flex direction="column" gap={4} data-testid="create-keyword-modal">
        <Text fontSize="larger">
          Weekly updates on the most recent, most popular, and most cited papers on your favorite keyword(s) or any
          other query
        </Text>
        {notification && (
          <FormControl>
            <FormLabel>Notification Name</FormLabel>
            <Input value={name} onChange={handleNameChange} autoFocus />
          </FormControl>
        )}
        <FormControl isInvalid={!kwValid}>
          <FormLabel>Set or Keywords</FormLabel>
          <Input
            onChange={handleKeywordsChange}
            value={keywords}
            autoFocus
            placeholder="star OR planet"
            data-testid="keyword-input"
          />
          <FormErrorMessage>{kwErrorMessage}</FormErrorMessage>
          <Text fontSize="sm" fontStyle="italic" mt={1}>
            Boolean &#34;AND&#34; is assumed, but can be overriden by using explicit logical operators between keywords
          </Text>
        </FormControl>
        <HStack mt={4} justifyContent="end">
          <Button isLoading={isAdding || isEditing} isDisabled={keywords.trim().length === 0 || !kwValid} type="submit">
            Submit
          </Button>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
        </HStack>
      </Flex>
    </form>
  );
};
