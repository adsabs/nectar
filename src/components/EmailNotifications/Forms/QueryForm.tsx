import { Button, Flex, FormControl, FormLabel, HStack, Input, useToast } from '@chakra-ui/react';

import { useStore } from '@/store';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Select, SelectOption } from '@/components/Select';
import { noop } from '@/utils/common/noop';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IADSApiAddNotificationParams, NotificationFrequency } from '@/api/vault/types';
import { useAddNotification, useVaultSearch } from '@/api/vault/vault';

const frequencyOptions: SelectOption<NotificationFrequency>[] = [
  {
    id: 'daily',
    value: 'daily',
    label: 'daily',
  },
  {
    id: 'weekly',
    value: 'weekly',
    label: 'Weekly',
  },
];

export const QueryForm = ({ onClose, onUpdated = noop }: { onClose: () => void; onUpdated?: () => void }) => {
  const toast = useToast({ duration: 2000 });

  const query = useStore((state) => state.query);

  const [frequencyOption, setFrequencyOption] = useState<SelectOption<NotificationFrequency>>(frequencyOptions[0]);

  const [name, setName] = useState<string>('');

  const [state, setState] = useState<'idle' | 'submitting'>('idle');

  const {
    data: searchData,
    isFetching: isSearching,
    error: searchError,
  } = useVaultSearch(query, { enabled: state === 'submitting', staleTime: 0 });

  const { mutate: addNotification, isLoading } = useAddNotification();

  const handleAddNotification = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('submitting');
  };

  useEffect(() => {
    // search finished
    if (!isSearching && state === 'submitting') {
      if (searchData) {
        const params: IADSApiAddNotificationParams = {
          qid: searchData.qid,
          frequency: frequencyOption.id,
          name: name,
          type: 'query',
          active: true,
          stateful: true,
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
      } else if (searchError) {
        toast({ status: 'error', title: 'Error', description: parseAPIError(searchError) });
      }
      setState('idle');
    }
  }, [isSearching, searchData, searchError]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleFrequencyChange = (option: SelectOption<NotificationFrequency>) => {
    setFrequencyOption(option);
  };

  return (
    <form onSubmit={handleAddNotification}>
      <Flex direction="column" gap={4} data-testid="create-query-modal">
        <FormControl>
          <FormLabel>Query</FormLabel>
          <Input readOnly defaultValue={query.q} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Notification Name</FormLabel>
          <Input value={name} onChange={handleNameChange} autoFocus isRequired data-testid="create-query-name" />
        </FormControl>
        <FormControl>
          <FormLabel>Frequency</FormLabel>
          <Select<SelectOption<NotificationFrequency>>
            label="Frequency"
            id="frequency-select"
            options={frequencyOptions}
            value={frequencyOption}
            onChange={handleFrequencyChange}
            stylesTheme="default"
          />
        </FormControl>
        <HStack mt={4} justifyContent="end">
          <Button type="submit" isLoading={isLoading || isSearching} isDisabled={name.trim().length === 0}>
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
