/* eslint-disable @typescript-eslint/no-misused-promises */
import { Database, IDocsEntity, useGetSingleRecord } from '@api';
import { IFeedbackParams } from '@api/feedback';
import {
  AlertStatus,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Textarea,
  Text,
  useDisclosure,
  CheckboxGroup,
} from '@chakra-ui/react';
import { PreviewModal, SimpleLink } from '@components';
import { IResourceUrl, useGetResourceLinks } from '@lib';
import { useStore } from '@store';
import { omit } from 'ramda';
import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { AuthorsField } from './AuthorsField';
import { BibcodeField } from './BibcodeField';
import { getDiffSections, getDiffString, processFormValues } from './DiffUtil';
import { KeywordsField } from './KeywordsField';
import { PubDateField } from './PubDateField';
import { ReferencesField } from './ReferencesField';
import { IAuthor, FormValues, IReference, DiffSection, IKeyword } from './types';
import { UrlsField } from './UrlsField';
import moment from 'moment';
import { DiffSectionPanel } from './DiffSectionPanel';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const collections: { value: Database; label: string }[] = [
  { value: 'astronomy', label: 'Astronomy and Astrophysics' },
  { value: 'physics', label: 'Physics and Geophysics' },
  { value: 'general', label: 'General' },
];

type State = 'idle' | 'loading-record' | 'loading-urls' | 'submitting' | 'preview';

const validationSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').min(1, 'Email is required'),
    collection: z.custom<Database>().array(),
    bibcode: z.string().min(1, 'Bibcode is required'),
    title: z.string().min(1, 'Title is required'),
    authors: z.custom<IAuthor>().array(),
    noAuthors: z.boolean(),
    publication: z.string().min(1, 'Publication is required'),
    pubDate: z.string().min(1, 'Publication date is required'),
    urls: z.custom<IResourceUrl>().array(),
    abstract: z.string().min(1, 'Abstract is required'),
    keywords: z.custom<IKeyword>().array(),
    references: z.custom<IReference>().array(),
    comments: z.string(),
  })
  .superRefine((schema, context) => {
    if (!schema.noAuthors && schema.authors.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['noAuthors'],
        message: 'Please confirm, this abstract has no author(s)',
      });
    }

    if (!moment(schema.pubDate, ['YYYY-MM', 'YYYY-MM-DD', 'YYYY-00', 'YYYY-00-00', 'YYYY-MM-00'], true).isValid()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pubDate'],
        message: 'Invalid date (should be in YYYY-MM format)',
      });
    }
    return z.NEVER;
  });

// TODO: pagination authors and other tables
// TODO: reorder authors

export const RecordPanel = ({
  isNew,
  onOpenAlert,
  onCloseAlert,
  isFocused,
}: {
  isNew: boolean;
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
  onCloseAlert: () => void;
  isFocused: boolean;
}) => {
  const username = useStore((state) => state.user.username);

  const initialFormValues = {
    name: '',
    email: username ?? '',
    bibcode: '',
    collection: [] as Database[],
    title: '',
    noAuthors: false,
    authors: [] as IAuthor[],
    publication: '',
    pubDate: '',
    urls: [] as IResourceUrl[],
    abstract: '',
    keywords: [] as IKeyword[],
    references: [] as IReference[],
    comments: '',
  };

  // original form values from existing record
  // used for diff view
  const [recordOriginalFormValues, setRecordOriginalFormValues] = useState<FormValues>(initialFormValues);

  const formMethods = useForm<FormValues>({
    defaultValues: recordOriginalFormValues,
    resolver: zodResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    shouldFocusError: true,
  });

  const {
    register,
    control,
    getValues,
    formState: { errors },
    reset,
    handleSubmit,
  } = formMethods;

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  const [state, setState] = useState<State>('idle');

  const isLoading = state === 'loading-record' || state === 'loading-urls' || state === 'submitting';

  // preview diff when editing existing record
  const [diffSections, setDiffSections] = useState<DiffSection[]>([]);

  // params for the submission query
  const [params, setParams] = useState<IFeedbackParams>(null);

  const nameFieldRef = useRef<HTMLInputElement>();

  // fetch record from bibcode
  const {
    data: recordData,
    isFetching: recordIsFetching,
    isSuccess: recordIsSuccess,
    error: recordError,
    refetch: recordRefetch,
  } = useGetSingleRecord(
    { id: getValues('bibcode') },
    {
      enabled: false,
      // cacheTime: 0,
    },
  );

  // fetch record's urls
  const {
    data: urlsData,
    isSuccess: urlsIsSuccess,
    isFetching: urlsIsFetching,
    refetch: urlsRefetch,
  } = useGetResourceLinks({
    identifier: getValues('bibcode'),
    options: { enabled: false },
  });

  // when this tab is focused, set focus on name field
  useEffect(() => {
    if (isFocused) {
      nameFieldRef.current.focus();
    }
  }, [isFocused]);

  useEffect(() => {
    if (state === 'idle') {
      // reset
      setParams(null);
      closePreview();
    } else if (state === 'loading-record') {
      setRecordOriginalFormValues({
        ...initialFormValues,
        name: getValues('name'),
        email: getValues('email'),
        bibcode: getValues('bibcode'),
      });
      void recordRefetch();
    } else if (state === 'loading-urls') {
      void urlsRefetch();
    } else if (state === 'submitting') {
      try {
        // prepare to open preview
        const values = getValues();

        if (!isNew) {
          setDiffSections(getDiffSections(recordOriginalFormValues, values));
        }

        const { email, name } = values;
        const diffString = isNew ? '' : getDiffString(recordOriginalFormValues, values);

        setParams({
          origin: 'user_submission',
          'g-recaptcha-response': null,
          _subject: `${isNew ? 'New' : 'Updated'} Record`,
          original: processFormValues(recordOriginalFormValues),
          new: processFormValues(values),
          name,
          email,
          diff: diffString,
        });
      } catch {
        onOpenAlert({ status: 'error', title: 'There was a problem processing diff. Plesae try again.' });
        setState('idle');
      }
    } else if (state === 'preview') {
      openPreview();
    }
  }, [state]);

  // record fetched
  useEffect(() => {
    if (!recordIsFetching) {
      if (recordIsSuccess && recordData.numFound > 0) {
        handleRecordLoaded(recordData.docs[0]);
        setState('loading-urls');
      } else if (recordIsSuccess && recordData.numFound === 0) {
        onOpenAlert({ status: 'error', title: 'Bibcode not found' });
        setState('idle');
      } else if (recordError) {
        onOpenAlert({
          status: 'error',
          title: recordError instanceof AxiosError ? recordError.message : 'Error fetching bibcode',
        });
        setState('idle');
      }
    }
  }, [recordData, recordIsFetching, recordIsSuccess, recordError]);

  // urls fetched
  useEffect(() => {
    if (!urlsIsFetching) {
      if (urlsIsSuccess) {
        handleUrlsLoaded(urlsData);
      }
      setState('idle');
    }
  }, [urlsIsFetching, urlsIsSuccess, urlsData]);

  // open preview when params set
  useEffect(() => {
    if (params !== null) {
      setState('preview');
    }
  }, [params]);

  // set form values when an original record data is loaded, cleared, updated
  useEffect(() => {
    reset(recordOriginalFormValues);
  }, [recordOriginalFormValues]);

  // react element of diff to be passed to preview
  const diffSectionPanels = useMemo(
    () =>
      diffSections.length === 0 ? (
        <strong>No Updates Detected</strong>
      ) : (
        <>
          {diffSections.map((section) => (
            <DiffSectionPanel key={section.label} section={section} />
          ))}
        </>
      ),
    [diffSections],
  );

  const handleOnLoadingRecord = () => {
    setState('loading-record');
  };

  // when record is fetched, process and set form values
  const handleRecordLoaded = (data: IDocsEntity) => {
    // clear any previous error messages
    onCloseAlert();

    if (!isNew) {
      const {
        abstract = '',
        aff,
        author,
        keyword = [],
        orcid_pub,
        pub_raw,
        pubdate,
        title,
        database = [],
        reference = [] as string[],
      } = data;
      const authors = author.map((name, index) => {
        return {
          name,
          aff: aff[index] !== '-' ? aff[index] : '',
          orcid: orcid_pub[index] !== '-' ? orcid_pub[index] : '',
        };
      });

      // TODO: support other types: Type is not implemented internally. Here we are saying type is always bibcode
      const references: IReference[] = reference.map((r) => ({ type: 'Bibcode', reference: r }));

      const loadedFormValues = {
        name: getValues('name'),
        email: getValues('email'),
        bibcode: getValues('bibcode'),
        abstract,
        title: title[0],
        publication: pub_raw,
        pubDate: pubdate,
        noAuthors: !author || authors.length === 0,
        authors,
        keywords: keyword.map(
          (k) =>
            ({
              value: k,
            } as IKeyword),
        ),
        collection: database,
        references,
        urls: [] as IResourceUrl[],
        comments: '',
      };

      setRecordOriginalFormValues(loadedFormValues);
    }
  };

  // when url data is fetch, set then in form values
  const handleUrlsLoaded = (urlsData: IResourceUrl[]) => {
    if (!isNew) {
      setRecordOriginalFormValues((prev) => ({ ...prev, urls: urlsData }));
    }
  };

  const handlePreview = () => {
    setState('submitting');
  };

  // submitted
  const handleOnSuccess = () => {
    onOpenAlert({ status: 'success', title: 'Feedback submitted successfully' });
    if (isNew) {
      reset();
    } else {
      setRecordOriginalFormValues(initialFormValues);
    }
    setState('idle');
  };

  // submission error or bibcode fetch error
  const handleError = (error: string) => {
    onOpenAlert({ status: 'error', title: error });
    setState('idle');
  };

  // to reset, clear original record values
  const handleReset = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setRecordOriginalFormValues(initialFormValues);
    onCloseAlert();
  };

  const handleClosePreview = () => {
    setState('idle');
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(handlePreview)}>
        <Stack direction="column" gap={4} m={0}>
          <Flex direction="row" gap={2} alignItems="start">
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input
                {...register('name', { required: true })}
                ref={(e) => {
                  register('name').ref(e);
                  nameFieldRef.current = e;
                }}
              />
              <FormErrorMessage>{errors.name && errors.name.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input {...register('email', { required: true })} type="email" />
              <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
            </FormControl>
          </Flex>

          <BibcodeField showLoadBtn={!isNew} onLoad={handleOnLoadingRecord} isLoading={isLoading} />

          {(isNew || (!isNew && !!recordOriginalFormValues.title)) && (
            <>
              <FormControl>
                <FormLabel>Collection</FormLabel>
                <Controller
                  name="collection"
                  control={control}
                  render={({ field: { ref, ...rest } }) => (
                    <CheckboxGroup {...rest}>
                      <Stack direction="row">
                        {collections.map((c) => (
                          <Checkbox key={`collection-${c.value}`} value={c.value}>
                            {c.label}
                          </Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  )}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input {...register('title', { required: true })} />
              </FormControl>

              <AuthorsField />

              <HStack gap={2} alignItems="start">
                <FormControl isRequired>
                  <FormLabel>Publication</FormLabel>
                  <Input {...register('publication', { required: true })} />
                </FormControl>

                <PubDateField />
              </HStack>

              <UrlsField />

              <FormControl isRequired>
                <FormLabel>Abstract</FormLabel>
                <Textarea {...register('abstract', { required: true })} rows={10} />
              </FormControl>

              <KeywordsField />

              {isNew ? (
                <ReferencesField />
              ) : (
                <FormControl>
                  <FormLabel>References</FormLabel>
                  <Text>
                    To add references, use the{' '}
                    <SimpleLink href="/feedback/missingreferences" display="inline">
                      Missing References
                    </SimpleLink>{' '}
                    form. To make changes to existing references, use the{' '}
                    <SimpleLink href="/feedback/general" display="inline">
                      General Feedback
                    </SimpleLink>{' '}
                    form.
                  </Text>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>User Comments</FormLabel>
                <Textarea {...register('comments')} />
              </FormControl>

              <HStack mt={2}>
                <Button type="submit" isLoading={isLoading}>
                  Preview
                </Button>
                <Button type="reset" variant="outline" onClick={handleReset} isDisabled={isLoading}>
                  Reset
                </Button>
              </HStack>
            </>
          )}
        </Stack>
      </form>

      {/* intentionally make this remount each time so that recaptcha is regenerated */}
      {isPreviewOpen && (
        <PreviewModal
          isOpen={isPreviewOpen}
          title={isNew ? 'Preview New Record Request' : 'Preview Record Correction Request'}
          submitterInfo={JSON.stringify({ name: getValues('name'), email: getValues('email') }, null, 2)}
          mainContentTitle={isNew ? 'New Record' : 'Record updates'}
          mainContent={isNew ? JSON.stringify(omit(['name', 'email'], getValues()), null, 2) : diffSectionPanels}
          onClose={handleClosePreview}
          onSuccess={handleOnSuccess}
          onError={handleError}
          params={params}
        />
      )}
    </FormProvider>
  );
};
