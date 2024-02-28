import { IADSApiAddNotificationParams, useAddNotification } from '@api';
import { Input, FormControl, FormLabel, HStack, Button, Flex, useToast, Text } from '@chakra-ui/react';
import { noop, parseAPIError } from '@utils';

import { ChangeEvent, useState } from 'react';

export const KeywordsForm = ({ onClose, onUpdated = noop }: { onClose: () => void; onUpdated?: () => void }) => {
  const toast = useToast({ duration: 2000 });

  const [keywords, setKeywords] = useState('');

  const { mutate: addNotification, isLoading } = useAddNotification();

  const handleKeywordsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeywords(e.target.value);
  };

  const handleAddNotification = () => {
    const params: IADSApiAddNotificationParams = {
      type: 'template',
      template: 'keyword',
      data: keywords.trim().length === 0 ? null : keywords,
    };

    addNotification(params, {
      onSettled(data, error) {
        if (error) {
          toast({ status: 'error', title: 'Error', description: parseAPIError(error) });
        } else {
          toast({ status: 'success', title: 'Notification Created' });
          onClose();
          onUpdated();
        }
      },
    });
  };

  return (
    <Flex direction="column" gap={4}>
      <Text fontSize="larger">
        Weekly updates on the most recent, most popular, and most cited papers on your favorite keyword(s) or any other
        query
      </Text>
      <FormControl>
        <FormLabel>Set or Keywords</FormLabel>
        <Input onChange={handleKeywordsChange} value={keywords} autoFocus placeholder="star OR planet" />
        <Text fontSize="sm" fontStyle="italic" mt={1}>
          Boolean "AND" is assumed, but can be overriden by using explicit logical operators between keywords
        </Text>
      </FormControl>
      <HStack mt={4} justifyContent="end">
        <Button isLoading={isLoading} onClick={handleAddNotification} isDisabled={keywords.length === 0}>
          Submit
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </HStack>
    </Flex>
  );
};
