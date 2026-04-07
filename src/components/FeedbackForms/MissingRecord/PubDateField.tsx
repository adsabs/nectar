import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import { FormValues } from './types';

export const PubDateField = () => {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();

  const { onChange: _onChange, ...rest } = register('pubDate');

  return (
    <FormControl isRequired isInvalid={!!errors.pubDate}>
      <FormLabel>Publication Date</FormLabel>
      <Input
        {...rest}
        placeholder="YYYY-MM"
        maxLength={10}
        onChange={(e) => {
          e.target.value = e.target.value.replace(/[^\d-]/g, '');
          setValue('pubDate', e.target.value, { shouldValidate: true, shouldDirty: true });
        }}
      />
      <FormErrorMessage>{errors.pubDate?.message}</FormErrorMessage>
    </FormControl>
  );
};
