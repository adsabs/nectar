import { IADSApiAddNotificationParams, useAddNotification } from '@api';
import { Box, Input, FormControl, FormLabel, HStack, Button } from '@chakra-ui/react';
import { Select } from '@components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { ValidationSchema } from './ValidationSchema';

export const QueryForm = ({ query, onClose }: { query: string; onClose: () => void }) => {
  const initialFormValues: IADSApiAddNotificationParams = {
    active: true,
    frequency: 'daily',
    name: null,
    type: 'query',
    qid: null,
    stateful: true,
    template: null,
    data: null,
  };

  const formMethods = useForm<IADSApiAddNotificationParams>({
    defaultValues: initialFormValues,
    resolver: zodResolver(ValidationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register,
    control,
    setValue,
    formState: { errors },
    reset,
    handleSubmit,
  } = formMethods;

  const { mutate: addNotification, isLoading, error } = useAddNotification();

  const qid = 'xxxx'; //TODO:

  const handleAddNotification = (params: IADSApiAddNotificationParams) => {
    addNotification(params, {
      onSettled(data, error) {
        if (error) {
          // TODO:
        } else {
          // TODO:
          onClose();
        }
      },
    });
  };

  const options = [
    {
      id: 'weekly',
      value: 'weekly',
      label: 'Weekly',
    },
    {
      id: 'daily',
      value: 'daily',
      label: 'daily',
    },
  ];

  return (
    <Box>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(handleAddNotification)}>
          <Input type="hidden" {...register('qid')} value={qid} />
          <FormControl>
            <FormLabel>Query</FormLabel>
            <Input readOnly>{query}</Input>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Notification Name</FormLabel>
            <Input {...register('name')} />
          </FormControl>
          <Select label="Frequency" id="frequency-select" options={options} />
          <HStack mt={4} justifyContent="end">
            <Button type="submit" isLoading={isLoading}>
              Submit
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </HStack>
        </form>
      </FormProvider>
    </Box>
  );
};
