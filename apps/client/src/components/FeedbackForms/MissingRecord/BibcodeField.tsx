import { FormControl, FormLabel, Flex, Input, Button, FormErrorMessage } from '@chakra-ui/react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormValues } from './types';

export const BibcodeField = ({
  showLoadBtn,
  onLoad,
  isLoading,
  isRequired,
}: {
  showLoadBtn: boolean;
  onLoad: (bibcode: string) => void;
  isLoading: boolean;
  isRequired: boolean;
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  const bibcode = useWatch<FormValues, 'bibcode'>({ name: 'bibcode' });

  const handleFetch = () => {
    onLoad(bibcode);
  };

  return (
    <FormControl isRequired={isRequired} isInvalid={!!errors.bibcode}>
      <FormLabel>{showLoadBtn ? `SciX-ID / DOI / Bibcode` : `Bibcode`}</FormLabel>
      <Flex direction="row">
        <Input {...register('bibcode', { required: isRequired })} />
        {showLoadBtn && (
          <Button
            size="md"
            borderStartRadius={0}
            borderEndRadius={2}
            isDisabled={isLoading || !bibcode || bibcode.length === 0}
            onClick={handleFetch}
            isLoading={isLoading}
          >
            Load
          </Button>
        )}
      </Flex>
      <FormErrorMessage>{errors.bibcode && errors.bibcode.message}</FormErrorMessage>
    </FormControl>
  );
};
