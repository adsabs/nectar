import { ExportApiFormatKey, useGetExportCitation, useSearch } from '@api';
import { IFeedbackParams } from '@api/feedback';
import {
  Flex,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  AlertStatus,
  useDisclosure,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useStore } from '@store';
import { omit } from 'ramda';
import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import { PreviewModal } from '../PreviewModal';
import { MissingReferenceTable } from './MissingReferenceTable';
import { FormValues, Reference } from './types';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

const validationSchema: Yup.ObjectSchema<FormValues> = Yup.object({
  name: Yup.string().required(),
  email: Yup.string().email().required(),
  references: Yup.array().of(Yup.mixed<Reference>()).required().min(1, 'At least one reference entry is required'),
});

type State = 'idle' | 'submitting' | 'validate-bibcodes' | 'fetch-refstring' | 'preview';

export const MissingReferenceForm = ({
  onOpenAlert,
}: {
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
}) => {
  const username = useStore((state) => state.user.username);

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  const [state, setState] = useState<State>('idle');

  // a list of all bibcodes for validation
  const [allBibcodes, setAllBibcodes] = useState<string[]>(null);

  const [params, setParams] = useState<IFeedbackParams>(null);

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    references: [],
  };

  const formMethods = useForm<FormValues>({
    defaultValues: initialFormValues,
    resolver: yupResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldFocusError: true,
  });

  const {
    register,
    setError,
    getValues,
    control,
    formState: { errors },
    reset,
  } = formMethods;

  const references = useWatch<FormValues, 'references'>({ name: 'references', control });

  // validate bibcodes exist
  const {
    data: bibcodesData,
    isFetching: bibcodesIsFetching,
    isLoading: bibcodesIsLoading,
    isSuccess: bibcodesIsSuccess,
    error: bibcodesError,
    refetch: bibcodesRefetch,
  } = useSearch(
    {
      fl: ['bibcode'],
      q: `identifier:(${allBibcodes?.join(' OR ')})`,
      rows: allBibcodes?.length,
    },
    { enabled: false },
  );

  const {
    data: refStringsData,
    error: refStringsError,
    isLoading: refIsLoading,
    isRefetching: refIsRefetching,
    refetch: refStringRefetch,
  } = useGetExportCitation(
    {
      format: ExportApiFormatKey.custom,
      customFormat: '%R (%1l (%Y), %Q)',
      bibcode: references.map((r) => r.cited),
    },
    { enabled: false },
  );

  useEffect(() => {
    if (state === 'idle') {
      setAllBibcodes(null);
      setParams(null);
      closePreview();
    } else if (state === 'validate-bibcodes' && allBibcodes) {
      void bibcodesRefetch();
    } else if (state === 'fetch-refstring') {
      void refStringRefetch();
    } else if (state === 'preview') {
      openPreview();
    }
  }, [state, allBibcodes]);

  // bibcodes fetched
  useEffect(() => {
    if (state === 'validate-bibcodes' && !bibcodesIsLoading && !bibcodesIsFetching) {
      const { email, name, references } = getValues();

      if (bibcodesIsSuccess && bibcodesData) {
        // check if all bibcodes valid, tigger preview
        // otherwise set form error
        if (bibcodesData.numFound === allBibcodes.length) {
          // set params will trigger opening preview
          setParams({
            origin: 'user_submission',
            'g-recaptcha-response': null,
            _subject: 'Missing References',
            name,
            email,
            references: null,
          });
          setState('fetch-refstring');
        } else {
          // form has invalid bibcode(s)
          // set error(s)
          const foundBibs = bibcodesData.docs.map((d) => d.bibcode);
          const invalidBibs = allBibcodes.filter((b) => !foundBibs.includes(b));

          references.forEach(({ citing, cited }, i) => {
            if (invalidBibs.includes(citing)) {
              setError(`references.${i}.citing`, {
                type: 'validate',
                message: 'Bibcode not found',
              });
            }
            if (invalidBibs.includes(cited)) {
              setError(`references.${i}.cited`, {
                type: 'validate',
                message: 'Bibcode not found',
              });
            }
          });
          setState('idle');
        }
      } else if (bibcodesError) {
        onOpenAlert({ status: 'error', title: 'Unable to verify bibcode, try again later' });
        setState('idle');
      }
    }
  }, [bibcodesData, bibcodesIsFetching, bibcodesIsSuccess, bibcodesError, bibcodesIsLoading]);

  // once refstrings are fetched, finish setting params
  useEffect(() => {
    if (state === 'fetch-refstring' && !refIsLoading && !refIsRefetching) {
      if (refStringsError) {
        onOpenAlert({ status: 'error', title: 'Error processing data, try again later' });
        setState('idle');
      } else if (refStringsData) {
        const refStrings = refStringsData.export.split(/\n/g);
        setParams((prev) => ({
          ...prev,
          references: references.map(({ citing, cited }, index) => ({
            citing,
            cited,
            refstring: refStrings[index],
          })),
        }));
        setState('preview');
      }
    }
  }, [refStringsData, refStringsError, refIsRefetching, refIsLoading]);

  const handlePreview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('submitting');

    // validate bibcodes
    const allBibs = references.reduce<string[]>((prev, curr) => {
      return [...prev, curr.cited, curr.citing];
    }, []);
    const bibsSet = new Set(allBibs);
    setAllBibcodes(Array.from(bibsSet));

    setState('validate-bibcodes');
  };

  // submitted
  const handleOnSuccess = () => {
    onOpenAlert({ status: 'success', title: 'Feedback submitted successfully' });
    reset(initialFormValues);
    setState('idle');
  };

  // submission error
  const handleError = (error: string) => {
    onOpenAlert({ status: 'error', title: error });
    setState('idle');
  };

  const handleReset = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    reset(initialFormValues);
  };

  const handleClosePreview = () => {
    setState('idle');
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handlePreview}>
        <Flex direction="column" gap={4} my={2}>
          <HStack gap={2}>
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input {...register('name', { required: true })} autoFocus />
              <FormErrorMessage>{errors.name && errors.name.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input {...register('email', { required: true })} type="email" />
              <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
            </FormControl>
          </HStack>
          <MissingReferenceTable />
          <HStack mt={2}>
            <Button type="submit" isLoading={state !== 'idle'}>
              Preview
            </Button>
            <Button variant="outline" onClick={handleReset} isDisabled={state !== 'idle'}>
              Reset
            </Button>
          </HStack>
        </Flex>
      </form>
      {/* intentionally make this remount each time so that recaptcha is regenerated */}
      {isPreviewOpen && (
        <PreviewModal
          isOpen={true}
          title="Preview Missing Reference Feedback"
          submitterInfo={JSON.stringify({ name: getValues('name'), email: getValues('email') }, null, 2)}
          mainContentTitle="Missing References"
          mainContent={JSON.stringify(omit(['name', 'email'], getValues()), null, 2)}
          onClose={handleClosePreview}
          onSuccess={handleOnSuccess}
          onError={handleError}
          params={params}
        />
      )}
    </FormProvider>
  );
};
