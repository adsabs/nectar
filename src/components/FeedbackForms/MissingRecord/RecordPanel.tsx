import { Database, IDocsEntity } from '@api';
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
import { IResourceUrl } from '@lib';
import { useStore } from '@store';
import { omit } from 'ramda';
import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { AuthorsField } from './AuthorsField';
import { BibcodeField } from './BibcodeField';
import { getDiffSections, getDiffString, processFormValues } from './DiffUtil';
import { KeywordsField } from './KeywordsField';
import { PubDateField } from './PubDateField';
import { ReferencesField } from './ReferencesField';
import { IAuthor, FormValues, IReference, DiffSection, IKeyword } from './types';
import { UrlsField } from './UrlsField';
import * as Yup from 'yup';
import moment from 'moment';
import { yupResolver } from '@hookform/resolvers/yup';
import { DiffSectionPanel } from './DiffSectionPanel';

const collections: { value: Database; label: string }[] = [
  { value: 'astronomy', label: 'Astronomy and Astrophysics' },
  { value: 'physics', label: 'Physics and Geophysics' },
  { value: 'general', label: 'General' },
];

const validationSchema: Yup.ObjectSchema<FormValues> = Yup.object({
  name: Yup.string().required(),
  email: Yup.string().email().required(),
  collection: Yup.array().of(Yup.mixed<Database>()),
  bibcode: Yup.string().required(),
  title: Yup.string().required(),
  authors: Yup.array().of(Yup.mixed<IAuthor>()),
  noAuthors: Yup.boolean().test('noAuthors', 'Please confirm, this abstract has no author(s)', (value, context) => {
    const hasAuthors = context?.parent?.authors?.length > 0;
    return (value && !hasAuthors) || (!value && hasAuthors);
  }),
  publication: Yup.string().required(),
  pubDate: Yup.string()
    .test('valid date', 'Invalid date (should be in YYYY-MM format)', (value: string) =>
      moment(value, ['YYYY-MM', 'YYYY-MM-DD', 'YYYY-00', 'YYYY-00-00', 'YYYY-MM-00'], true).isValid(),
    )
    .required(),
  urls: Yup.array().of(Yup.mixed<IResourceUrl>()),
  abstract: Yup.string().required(),
  keywords: Yup.array().of(Yup.mixed<IKeyword>()),
  references: Yup.array().of(Yup.mixed<IReference>()),
  comments: Yup.string().ensure(),
});

// TODO: scroll to top after submission
// TODO: pagination authors and other tables
// TODO: reorder authors
// TODO: validate bibcodes
// TODO: wrap preview in error boundary (diff might throw error)

export const RecordPanel = ({
  isNew,
  onOpenAlert,
  isFocused,
}: {
  isNew: boolean;
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
  isFocused: boolean;
}) => {
  const username = useStore((state) => state.user.username);

  const intialFormValues = {
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
  const [recordOriginalFormValues, setRecordOriginalFormValues] = useState<FormValues>(intialFormValues);

  const formMethods = useForm<FormValues>({
    defaultValues: recordOriginalFormValues,
    resolver: yupResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register,
    control,
    getValues,
    handleSubmit: handlePreview,
    formState: { errors },
    reset,
  } = formMethods;

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  // preview diff when editing existing record
  const [diffSections, setDiffSections] = useState<DiffSection[]>([]);

  // params for the submission query
  const [params, setParams] = useState<IFeedbackParams>(null);

  const nameFieldRef = useRef<HTMLInputElement>();

  // when this tab is focused, set focus on name field
  useEffect(() => {
    if (isFocused) {
      nameFieldRef.current.focus();
    }
  }, [isFocused]);

  // open preview when params set
  useEffect(() => {
    if (params !== null) {
      openPreview();
    }
  }, [params]);

  // set form values when an original record data is loaded, cleared, updated
  useEffect(() => {
    reset(recordOriginalFormValues);
  }, [recordOriginalFormValues]);

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

  // when record is fetched, process and set form values
  const handleRecordLoaded = (data: IDocsEntity) => {
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

  const onPreview: SubmitHandler<FormValues> = (values) => {
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
  };

  // submitted
  const handleOnSuccess = () => {
    onOpenAlert({ status: 'success', title: 'Feedback submitted successfully' });
    if (isNew) {
      reset();
    } else {
      setRecordOriginalFormValues(intialFormValues);
    }
  };

  // submission error or bibcode fetch error
  const handleError = (error: string) => {
    onOpenAlert({ status: 'error', title: error });
  };

  // to reset, clear original record values
  const handleReset = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setRecordOriginalFormValues(intialFormValues);
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handlePreview(onPreview)}>
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

          <BibcodeField
            showLoadBtn={!isNew}
            onDataLoaded={handleRecordLoaded}
            onUrlsLoaded={handleUrlsLoaded}
            onFetchError={handleError}
          />

          {(isNew || (!isNew && !!recordOriginalFormValues.bibcode)) && (
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
                <Button type="submit">Preview</Button>
                <Button type="reset" variant="outline" onClick={handleReset}>
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
          onClose={closePreview}
          onSuccess={handleOnSuccess}
          onError={handleError}
          params={params}
        />
      )}
    </FormProvider>
  );
};
