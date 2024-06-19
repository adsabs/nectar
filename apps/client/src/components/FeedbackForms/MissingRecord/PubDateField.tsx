import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import { FormValues } from './types';

export const PubDateField = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <FormControl isRequired isInvalid={!!errors.pubDate}>
      <FormLabel>Publication Date</FormLabel>
      <Input {...register('pubDate')} placeholder="yyyy-mm-dd" />
      <FormErrorMessage>{errors.pubDate && errors.pubDate.message}</FormErrorMessage>
    </FormControl>
  );
};
