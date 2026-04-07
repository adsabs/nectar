import { FormControl, FormLabel, Checkbox, FormErrorMessage } from '@chakra-ui/react';
import { useFormContext, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { forwardRef } from 'react';
import { AuthorsTable, AuthorsTableHandle } from './AuthorsTable';
import { FormValues } from './types';

export const AuthorsField = forwardRef<AuthorsTableHandle>(function AuthorsField(_, ref) {
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const { fields: authors } = useFieldArray<FormValues, 'authors'>({
    name: 'authors',
  });

  const noAuthors = useWatch<FormValues, 'noAuthors'>({ name: 'noAuthors' });

  return (
    <>
      <FormControl isRequired isInvalid={!!errors.authors}>
        <FormLabel>Authors</FormLabel>
        {!noAuthors && <AuthorsTable editable={true} ref={ref} />}
      </FormControl>

      {authors.length === 0 && (
        <FormControl isInvalid={!!errors.noAuthors}>
          <Controller
            name="noAuthors"
            control={control}
            render={({ field: { onChange, value, ref: inputRef } }) => (
              <Checkbox onChange={onChange} ref={inputRef} isChecked={value}>
                Abstract has no author(s)
              </Checkbox>
            )}
          />
          <FormErrorMessage>{errors.noAuthors && errors.noAuthors.message}</FormErrorMessage>
        </FormControl>
      )}
    </>
  );
});
