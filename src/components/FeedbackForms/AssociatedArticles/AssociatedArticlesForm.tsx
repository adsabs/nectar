import { CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  AlertStatus,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Stack,
  useDisclosure,
} from '@chakra-ui/react';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangeEvent, KeyboardEvent, MouseEventHandler, useEffect, useRef, useState } from 'react';
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';
import { omit } from 'ramda';

import { PreviewModal } from '@/components/FeedbackForms';
import { Select, SelectOption } from '@/components/Select';
import { useGetUserEmail } from '@/lib/useGetUserEmail';
import { useSearch } from '@/api/search/search';
import { AssociatedBibcode, IFeedbackParams, Relationship } from '@/api/feedback/types';

type FormValues = {
  name: string;
  email: string;
  relationship: Relationship;
  otherRelationship: string;
  mainBibcode: string;
  associatedBibcodes: AssociatedBibcode[];
};

type State = 'idle' | 'submitting' | 'validate-bibcodes' | 'preview';

const validationSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').min(1, 'Email is required'),
    relationship: z.custom<Relationship>(),
    otherRelationship: z.string(),
    mainBibcode: z.string().min(1, 'Required'),
    associatedBibcodes: z.custom<AssociatedBibcode>().array().min(1, 'At least one associated bibcode is required'),
  })
  .superRefine((schema, context) => {
    if (schema.relationship === 'other' && schema.otherRelationship.length < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherRelationship'],
        message: 'Relationship name required',
      });
    }
    return z.NEVER;
  });

export const AssociatedArticlesForm = ({
  onOpenAlert,
}: {
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
}) => {
  const userEmail = useGetUserEmail();

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  const [state, setState] = useState<State>('idle');

  const initialFormValues: FormValues = {
    name: '',
    email: userEmail ?? '',
    relationship: 'errata',
    otherRelationship: '',
    mainBibcode: '',
    associatedBibcodes: [],
  };

  const formMethods = useForm<FormValues>({
    defaultValues: initialFormValues,
    resolver: zodResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    shouldFocusError: true,
  });

  const {
    register,
    setError,
    getValues,
    formState: { errors, isValid },
    reset,
    handleSubmit,
  } = formMethods;

  // list of bibcodes for validation
  const [allBibcodes, setAllBibcodes] = useState<string[]>(null);

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

  useEffect(() => {
    if (state === 'idle') {
      setAllBibcodes(null);
      setParams(null);
      closePreview();
    } else if (state === 'submitting') {
      const { mainBibcode, associatedBibcodes, relationship } = getValues();

      // validate bibcodes

      // if relationship is 'other', associated bibcodes could be DOI or URL, these do not need to be validated
      const relatedBibcodes =
        relationship === 'other'
          ? associatedBibcodes.filter((b) => !b.value.includes('/')) // if string has '/' assume it's URL or DOI
          : associatedBibcodes;
      const bibsSet = new Set([mainBibcode, ...relatedBibcodes.map((b) => b.value)]);
      setAllBibcodes(Array.from(bibsSet));
    } else if (state === 'validate-bibcodes' && allBibcodes) {
      void bibcodesRefetch();
    } else if (state === 'preview') {
      openPreview();
    }
  }, [state]);

  useEffect(() => {
    if (!!allBibcodes) {
      setState('validate-bibcodes');
    }
  }, [allBibcodes]);

  // bibcodes fetched
  useEffect(() => {
    if (state === 'validate-bibcodes' && !bibcodesIsLoading && !bibcodesIsFetching) {
      const { email, name, relationship, otherRelationship, mainBibcode, associatedBibcodes } = getValues();

      if (bibcodesIsSuccess && bibcodesData) {
        // check if all bibcodes valid, tigger preview
        // otherwise set form error
        if (bibcodesData.numFound === allBibcodes.length) {
          // set params will trigger opening preview
          setParams({
            origin: 'user_submission',
            _subject: 'Associated Articles',
            name,
            email,
            'g-recaptcha-response': null,
            source: mainBibcode,
            target: associatedBibcodes.map((b) => b.value),
            relationship: relationship,
            custom_name: otherRelationship.length === 0 ? undefined : otherRelationship,
          });

          setState('preview');
        } else {
          // form has invalid bibcode(s)
          // set error(s)
          const foundBibs = bibcodesData.docs.map((d) => d.bibcode);
          const invalidBibs = allBibcodes.filter((b) => !foundBibs.includes(b));
          console.log(invalidBibs);

          if (invalidBibs.includes(mainBibcode)) {
            setError('mainBibcode', { message: 'Bibcode not found' });
          }

          associatedBibcodes.forEach((b, i) => {
            if (invalidBibs.includes(b.value)) {
              setError(`associatedBibcodes.${i}`, {
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

  const [params, setParams] = useState<IFeedbackParams>(null);

  // open preview when params set
  useEffect(() => {
    if (params !== null) {
      openPreview();
    }
  }, [params]);

  // clear params when preview closed
  useEffect(() => {
    if (!isPreviewOpen) {
      setParams(null);
    }
  }, [isPreviewOpen]);

  const handlePreview = () => {
    setState('submitting');
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

  const handleReset: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    reset(initialFormValues);
  };

  const handleClosePreview = () => {
    setState('idle');
  };

  return (
    <FormProvider {...formMethods}>
      <Flex direction="column" gap={4} my={2}>
        <Stack direction={{ base: 'column', sm: 'row' }} gap={2}>
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
        </Stack>
        <AssociatedTable />
        <HStack mt={2}>
          <Button
            type="submit"
            isLoading={state !== 'idle'}
            isDisabled={!isValid}
            onClick={handleSubmit(handlePreview)}
          >
            Preview
          </Button>
          <Button type="reset" variant="outline" onClick={handleReset} isDisabled={state !== 'idle'}>
            Reset
          </Button>
        </HStack>
      </Flex>

      {/* intentionally make this remount each time so that recaptcha is regenerated */}
      {isPreviewOpen && (
        <PreviewModal
          params={params}
          isOpen={true}
          title="Preview Associated Articles Request"
          submitterInfo={JSON.stringify({ name: getValues('name'), email: getValues('email') }, null, 2)}
          mainContentTitle="Correlated Articles"
          mainContent={JSON.stringify(omit(['name', 'email'], getValues()), null, 2)}
          onClose={handleClosePreview}
          onSuccess={handleOnSuccess}
          onError={handleError}
        />
      )}
    </FormProvider>
  );
};

const relationOptions: SelectOption<Relationship>[] = [
  { id: 'errata', value: 'errata', label: 'Main Paper/Errata' },
  { id: 'addenda', value: 'addenda', label: 'Main Paper/Addenda' },
  { id: 'series', value: 'series', label: 'Series of Articles' },
  { id: 'arxiv', value: 'arxiv', label: 'arXiv/Published' },
  { id: 'duplicate', value: 'duplicate', label: 'Duplicate Articles' },
  { id: 'other', value: 'other', label: 'Other' },
];

export const AssociatedTable = () => {
  const {
    register,
    setValue,
    formState: { errors },
    setFocus,
  } = useFormContext<FormValues>();

  const [newAssociatedBibcode, setNewAssociatedBibcode] = useState('');

  const newAssociatedBibcodeRef = useRef<HTMLInputElement>();

  const relationship = useWatch<FormValues, 'relationship'>({ name: 'relationship' });

  const {
    fields: associatedBibcodes,
    remove,
    append,
  } = useFieldArray<FormValues, 'associatedBibcodes'>({
    name: 'associatedBibcodes',
  });

  const handleNewAssociatedBibcodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAssociatedBibcode(e.target.value);
  };

  const handleRelationshipChange = (option: SelectOption<Relationship>) => {
    if (option.id !== 'other') {
      setFocus('mainBibcode');
    }
    setValue('relationship', option.id);
  };

  const handleAddAssociatedBibcode = () => {
    append({ value: newAssociatedBibcode });
    setNewAssociatedBibcode('');
  };

  const handleKeydownNewBibcode = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newAssociatedBibcode.length > 0) {
      handleAddAssociatedBibcode();
    }
  };

  useEffect(() => {
    if (newAssociatedBibcode === '') {
      newAssociatedBibcodeRef.current.focus();
    }
  }, [newAssociatedBibcode]);

  return (
    <>
      <FormControl isRequired isInvalid={!!errors.relationship}>
        <FormLabel>Relation Type</FormLabel>
        <Select<SelectOption<Relationship>>
          options={relationOptions}
          value={relationOptions.find((o) => o.id === relationship) ?? null}
          name="relation-type"
          label="Relation Type"
          id="relation-options"
          stylesTheme="default"
          onChange={handleRelationshipChange}
        />
        <FormErrorMessage>{!!errors.relationship && errors.relationship}</FormErrorMessage>
      </FormControl>

      {relationship !== null && (
        <>
          {relationship === 'other' && (
            <FormControl isRequired>
              <FormLabel>Custom Relation Type</FormLabel>
              <Input {...register('otherRelationship')} autoFocus />
            </FormControl>
          )}
          <FormControl isRequired isInvalid={!!errors.mainBibcode}>
            <FormLabel>{`${
              relationship === 'arxiv' ? 'arXiv ' : relationship === 'other' ? '' : 'Main Paper '
            }Bibcode`}</FormLabel>
            <Input {...register('mainBibcode')} />
            <FormErrorMessage>{!!errors.mainBibcode && errors.mainBibcode.message}</FormErrorMessage>
          </FormControl>

          <Flex direction="column" gap={2}>
            <FormControl>
              <FormLabel>
                {`${
                  relationship === 'errata'
                    ? 'Errata '
                    : relationship === 'addenda'
                    ? 'Addenda '
                    : relationship === 'series'
                    ? 'Series of articles '
                    : relationship === 'arxiv'
                    ? 'Main paper '
                    : relationship === 'duplicate'
                    ? 'Duplicate '
                    : 'Related '
                }${relationship === 'other' ? 'Bibcode, Associated URL, or DOI without prefix' : 'Bibcode(s)'}`}
              </FormLabel>
              {relationship === 'other' && (
                <FormHelperText>i.e. https://doi.org/10.1093/mnras/stae2140, 10.1093/mnras/stae2140</FormHelperText>
              )}
              <Flex direction="column" gap={2}>
                {associatedBibcodes.map((b, index) => (
                  <FormControl isInvalid={!!errors.associatedBibcodes?.[index]} key={`asso-bib-${b.value}`}>
                    <HStack>
                      <Input {...register(`associatedBibcodes.${index}.value`)} />
                      <IconButton
                        data-index={index}
                        aria-label="Delete"
                        size="md"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => remove(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </HStack>
                    <FormErrorMessage>
                      {!!errors.associatedBibcodes?.[index] && errors.associatedBibcodes[index].message}
                    </FormErrorMessage>
                  </FormControl>
                ))}
              </Flex>
            </FormControl>

            <FormControl>
              <HStack>
                <Input
                  onChange={handleNewAssociatedBibcodeChange}
                  value={newAssociatedBibcode}
                  ref={newAssociatedBibcodeRef}
                  onKeyDown={handleKeydownNewBibcode}
                />
                <IconButton
                  aria-label="Add"
                  variant="outline"
                  size="md"
                  colorScheme="green"
                  onClick={handleAddAssociatedBibcode}
                  isDisabled={!newAssociatedBibcode}
                >
                  <CheckIcon />
                </IconButton>
              </HStack>
            </FormControl>
          </Flex>
        </>
      )}
    </>
  );
};
