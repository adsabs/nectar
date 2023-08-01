import { IDocsEntity, useGetSingleRecord } from '@api';
import { FormControl, FormLabel, Flex, Input, Button, FormErrorMessage } from '@chakra-ui/react';
import { IResourceUrl, useGetResourceLinks } from '@lib';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormValues } from './types';

export const BibcodeField = ({
  showLoadBtn,
  onDataLoaded,
  onUrlsLoaded,
}: {
  showLoadBtn: boolean;
  onDataLoaded: (data: IDocsEntity) => void;
  onUrlsLoaded: (urls: IResourceUrl[]) => void;
}) => {
  const {
    register,
    getValues,
    setError,
    formState: { errors },
  } = useFormContext<FormValues>();

  const bibcode = useWatch<FormValues, 'bibcode'>({ name: 'bibcode' });

  const [fetch, setFetch] = useState(false);

  // fetch record from bibcode
  const { data, isLoading, isSuccess, error, isFetching } = useGetSingleRecord(
    { id: getValues('bibcode') },
    {
      enabled: fetch,
      cacheTime: 0,
    },
  );

  // fetch record's urls
  const {
    data: urlsData,
    isSuccess: urlsIsSuccess,
    isFetched: urlIsFetched,
  } = useGetResourceLinks({
    identifier: getValues('bibcode'),
    options: { enabled: fetch, cacheTime: 0 },
  });

  useEffect(() => {
    if (isSuccess && data.numFound > 0) {
      onDataLoaded(data.docs[0]);
    } else if (isSuccess && data.numFound === 0) {
      setError('bibcode', { message: 'Bibcode not found' });
    } else if (error) {
      setError('bibcode', { message: error instanceof AxiosError ? error.message : 'Error fetching bibcode' });
    }
  }, [data, isLoading, isSuccess, error]);

  useEffect(() => {
    if (urlIsFetched && urlsIsSuccess) {
      onUrlsLoaded(urlsData);
    }
  }, [urlIsFetched, urlsIsSuccess]);

  const handleFetch = () => {
    setFetch(true);
  };

  useEffect(() => {
    if (!isFetching) {
      setFetch(false);
    }
  }, [isFetching]);

  return (
    <FormControl isRequired isInvalid={!!errors.bibcode}>
      <FormLabel>{showLoadBtn ? `SciX-ID / DOI / Bibcode` : `Bibcode`}</FormLabel>
      <Flex direction="row">
        <Input {...register('bibcode', { required: true })} />
        {showLoadBtn && (
          <Button
            size="md"
            borderStartRadius={0}
            borderEndRadius={2}
            isDisabled={isFetching || !bibcode || bibcode.length === 0}
            onClick={handleFetch}
            isLoading={isFetching}
          >
            Load
          </Button>
        )}
      </Flex>
      <FormErrorMessage>{errors.bibcode && errors.bibcode.message}</FormErrorMessage>
    </FormControl>
  );
};
