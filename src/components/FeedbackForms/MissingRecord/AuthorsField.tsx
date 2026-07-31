import { FormControl, FormLabel, RadioGroup, Stack, Radio, FormErrorMessage } from '@chakra-ui/react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { AuthorsTable } from './AuthorsTable';
import { FormValues } from './types';

export const AuthorsField = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const authorsState = useWatch<FormValues, 'authorsState'>({ name: 'authorsState' });
  const authors = useWatch<FormValues, 'authors'>({ name: 'authors' });

  return (
    <>
      <FormControl isInvalid={!!errors.authorsState} isRequired>
        <FormLabel>Authors</FormLabel>
        <Controller
          name="authorsState"
          control={control}
          render={({ field: { onChange, value, ref } }) => (
            <RadioGroup onChange={onChange} ref={ref} value={value}>
              <Stack direction="row">
                <Radio value="noAuthors" isDisabled={authors.length > 0}>
                  Abstract has no authors
                </Radio>
                <Radio value="hasAuthors">Abstract has authors</Radio>
              </Stack>
            </RadioGroup>
          )}
        />
        <FormErrorMessage>{errors.authorsState && errors.authorsState.message}</FormErrorMessage>
      </FormControl>

      <FormControl isInvalid={!!errors.authors}>
        {authorsState === 'hasAuthors' && (
          <>
            <AuthorsTable editable={true} />
          </>
        )}
      </FormControl>
    </>
  );
};
