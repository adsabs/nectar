import { FormControl, FormLabel, Checkbox, FormErrorMessage } from '@chakra-ui/react';
import { useFormContext, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { AuthorsTable } from './AuthorsTable';
import { FormValues } from './types';

export const AuthorsField = () => {
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
      <FormControl isInvalid={!!errors.authors}>
        <FormLabel>Authors</FormLabel>
        {!noAuthors && (
          <>
            <AuthorsTable editable={true} />
          </>
        )}
      </FormControl>

      <>
        {authors.length === 0 && (
          <FormControl isInvalid={!!errors.noAuthors}>
            <Controller
              name="noAuthors"
              control={control}
              render={({ field: { onChange, value, ref } }) => (
                <Checkbox onChange={onChange} ref={ref} isChecked={value}>
                  Abstract has no author(s)
                </Checkbox>
              )}
            />
            <FormErrorMessage>{errors.noAuthors && errors.noAuthors.message}</FormErrorMessage>
          </FormControl>
        )}
      </>
    </>
  );
};
