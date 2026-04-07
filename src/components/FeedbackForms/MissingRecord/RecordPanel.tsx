import {
  AlertStatus,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';

import { omit } from 'ramda';
import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { AuthorsField } from './AuthorsField';
import { AuthorsTableHandle } from './AuthorsTable';
import { BibcodeField } from './BibcodeField';
import { DraftBanner } from './DraftBanner';
import { FormChecklist } from './FormChecklist';
import { getDiffSections, getDiffString, processFormValues } from './DiffUtil';
import { KeywordsField } from './KeywordsField';
import { PubDateField } from './PubDateField';
import { RecordWizard } from './RecordWizard';
import { ReferencesField, ReferencesTableHandle } from './ReferencesField';
import { DiffSection, FormValues, IAuthor, IKeyword, IReference } from './types';
import { UrlsField, UrlsTableHandle } from './UrlsField';
import { DiffSectionPanel } from './DiffSectionPanel';
import { useFormDraft } from './useFormDraft';
import { COLLECTIONS } from './types';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SimpleLink } from '@/components/SimpleLink';
import { PreviewModal } from '@/components/FeedbackForms';
import { IResourceUrl, useGetResourceLinks } from '@/lib/useGetResourceLinks';
import { useGetUserEmail } from '@/lib/useGetUserEmail';
import type { Database, IDocsEntity } from '@/api/search/types';
import type { IFeedbackParams } from '@/api/feedback/types';
import { useGetSingleRecord } from '@/api/search/search';
import { LocalSettings } from '@/types';

type State = 'idle' | 'loading-record' | 'loading-urls' | 'submitting' | 'preview';
type FormMode = 'expert' | 'guided';

// accepts YYYY-MM or YYYY-MM-DD; lax on day (00 is valid for ADS)
const PUB_DATE_RE = /^\d{4}-\d{2}(-\d{2})?$/;

function isInvalidPubDate(pubdate: string): boolean {
  return !PUB_DATE_RE.test(pubdate);
}

const validationSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').min(1, 'Email is required'),
    collection: z.custom<Database>().array(),
    isNew: z.boolean(),
    bibcode: z.string(),
    title: z.string().min(1, 'Title is required'),
    authors: z.custom<IAuthor>().array(),
    noAuthors: z.boolean(),
    publication: z.string().min(1, 'Publication is required'),
    pubDate: z.string().min(1, 'Publication date is required'),
    urls: z.custom<IResourceUrl>().array(),
    abstract: z.string(),
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

    if (isInvalidPubDate(schema.pubDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pubDate'],
        message: 'Invalid date (should be in YYYY-MM format)',
      });
    }

    if (!schema.isNew && schema.bibcode.length < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bibcode'],
        message: 'Bibcode is required',
      });
    }
    return z.NEVER;
  });

function getDraftKey(isNew: boolean, bibcode?: string): string | null {
  if (isNew) {
    return LocalSettings.FEEDBACK_DRAFT_NEW;
  }
  if (bibcode) {
    return `feedback-draft:edit-record:${bibcode}`;
  }
  return null;
}

function getInitialMode(): FormMode {
  try {
    const stored = localStorage.getItem(LocalSettings.FEEDBACK_FORM_MODE);
    return stored === 'guided' ? 'guided' : 'expert';
  } catch {
    return 'expert';
  }
}

interface RecordPanelProps {
  isNew: boolean;
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
  onCloseAlert: () => void;
  isFocused: boolean;
  bibcode?: string;
}

export function RecordPanel({ isNew, onOpenAlert, onCloseAlert, isFocused, bibcode }: RecordPanelProps) {
  const userEmail = useGetUserEmail();

  const initialFormValues = {
    name: '',
    email: userEmail ?? '',
    bibcode: bibcode ?? '',
    isNew,
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

  const [recordOriginalFormValues, setRecordOriginalFormValues] = useState<FormValues>(initialFormValues);

  const formMethods = useForm<FormValues>({
    defaultValues: recordOriginalFormValues,
    resolver: zodResolver(validationSchema),
    mode: 'onTouched',
    reValidateMode: 'onBlur',
    shouldFocusError: true,
  });

  const {
    register,
    control,
    getValues,
    formState: { errors, isValid },
    reset,
    handleSubmit,
    setFocus,
  } = formMethods;

  const authorsRef = useRef<AuthorsTableHandle>(null);
  const referencesRef = useRef<ReferencesTableHandle>(null);
  const urlsRef = useRef<UrlsTableHandle>(null);

  // New records use a fixed key; edit records scope to bibcode
  const draftKey = getDraftKey(isNew, bibcode);

  const { hasDraft, getDraftValues, clearDraft, cancelPendingSave } = useFormDraft(draftKey, formMethods);
  const [showDraftBanner, setShowDraftBanner] = useState(hasDraft);

  const [formMode, setFormMode] = useState<FormMode>(() => (isNew ? getInitialMode() : 'expert'));

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  const [state, setState] = useState<State>(bibcode ? 'loading-record' : 'idle');

  const isLoading = state === 'loading-record' || state === 'loading-urls' || state === 'submitting';

  // preview diff when editing existing record
  const [diffSections, setDiffSections] = useState<DiffSection[]>([]);

  // params for the submission query
  const [params, setParams] = useState<IFeedbackParams>(null);

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
      setFocus('name');
    }
  }, [isFocused, setFocus]);

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
        isNew: false,
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
        onOpenAlert({ status: 'error', title: 'Could not generate diff preview. Please try again.' });
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
        author = [],
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
        isNew,
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

  const handleStandardPreview = handleSubmit(() => {
    authorsRef.current?.flush();
    referencesRef.current?.flush();
    urlsRef.current?.flush();
    handlePreview();
  });

  // submitted
  const handleOnSuccess = () => {
    onOpenAlert({ status: 'success', title: 'Feedback submitted successfully' });
    clearDraft();
    setShowDraftBanner(false);
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

  const handleRestoreDraft = () => {
    const draft = getDraftValues();
    if (!draft) {
      return;
    }
    cancelPendingSave();
    // preserve authenticated email over any email stored in the draft
    const mergedEmail = userEmail ?? draft.email;
    reset({ ...draft, email: mergedEmail });
    setShowDraftBanner(false);
  };

  const handleDismissDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
  };

  const handleModeChange = (mode: FormMode) => {
    setFormMode(mode);
    try {
      localStorage.setItem(LocalSettings.FEEDBACK_FORM_MODE, mode);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Stack direction="column" gap={4} m={0}>
        <DraftBanner show={showDraftBanner} onRestore={handleRestoreDraft} onDismiss={handleDismissDraft} />

        {isNew && (
          <HStack>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button
                isActive={formMode === 'expert'}
                onClick={() => handleModeChange('expert')}
                aria-pressed={formMode === 'expert'}
              >
                Standard
              </Button>
              <Button
                isActive={formMode === 'guided'}
                onClick={() => handleModeChange('guided')}
                aria-pressed={formMode === 'guided'}
              >
                Guided
              </Button>
            </ButtonGroup>
          </HStack>
        )}

        {formMode !== 'guided' && (
          <Flex direction={{ base: 'column', sm: 'row' }} gap={2} alignItems="start">
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input {...register('name', { required: true })} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input {...register('email', { required: true })} type="email" />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
          </Flex>
        )}

        {!(isNew && formMode === 'guided') && (
          <BibcodeField showLoadBtn={!isNew} onLoad={handleOnLoadingRecord} isLoading={isLoading} isRequired={!isNew} />
        )}

        {isNew && formMode === 'guided' ? (
          <RecordWizard onPreview={handleSubmit(handlePreview)} isLoading={isLoading} />
        ) : (
          (isNew || !!recordOriginalFormValues.title) && (
            <Flex direction={{ base: 'column', md: 'row' }} gap={6} alignItems="start">
              <Stack flex={1} spacing={4}>
                <FormControl>
                  <FormLabel>Collection</FormLabel>
                  <Controller
                    name="collection"
                    control={control}
                    render={({ field: { ref: _ref, ...rest } }) => (
                      <CheckboxGroup {...rest}>
                        <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between">
                          {COLLECTIONS.map((c) => (
                            <Checkbox key={`collection-${c.value}`} value={c.value}>
                              {c.label}
                            </Checkbox>
                          ))}
                        </Stack>
                      </CheckboxGroup>
                    )}
                  />
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.title}>
                  <FormLabel>Title</FormLabel>
                  <Input {...register('title', { required: true })} />
                  <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
                </FormControl>

                <AuthorsField ref={authorsRef} />

                <Stack direction={{ base: 'column', sm: 'row' }} gap={2} alignItems="start">
                  <FormControl isRequired isInvalid={!!errors.publication}>
                    <FormLabel>Publication</FormLabel>
                    <Input {...register('publication', { required: true })} />
                    <FormErrorMessage>{errors.publication?.message}</FormErrorMessage>
                  </FormControl>

                  <PubDateField />
                </Stack>

                <UrlsField ref={urlsRef} />

                <FormControl>
                  <FormLabel>Abstract</FormLabel>
                  <Textarea {...register('abstract')} rows={10} />
                </FormControl>

                <KeywordsField />

                {isNew ? (
                  <ReferencesField ref={referencesRef} />
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
                  <Button isLoading={isLoading} isDisabled={!isValid} onClick={handleStandardPreview}>
                    Preview
                  </Button>
                  <Button variant="outline" onClick={handleReset} isDisabled={isLoading}>
                    Reset
                  </Button>
                </HStack>
              </Stack>

              {isNew && (
                <Box position={{ base: 'static', md: 'sticky' }} top={{ md: 4 }} alignSelf="flex-start">
                  <FormChecklist />
                </Box>
              )}
            </Flex>
          )
        )}
      </Stack>

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
}
