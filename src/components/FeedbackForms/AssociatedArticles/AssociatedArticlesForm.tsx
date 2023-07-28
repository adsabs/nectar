import { IFeedbackParams, Relationship } from '@api/feedback';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import {
  Flex,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  IconButton,
  AlertStatus,
  useDisclosure,
} from '@chakra-ui/react';
import { Select, SelectOption } from '@components';
import { useStore } from '@store';
import { Formik, Form, Field, useField, FieldArray, FieldProps, FieldArrayRenderProps, FormikProps } from 'formik';
import { omit } from 'ramda';
import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { PreviewModal } from '../PreviewModal';

type FormValues = {
  name: string;
  email: string;
  relationship: Relationship;
  otherRelationship: string;
  mainBibcode: string;
  associatedBibcodes: string[];
};

export const AssociatedArticlesForm = ({
  onOpenAlert,
}: {
  onOpenAlert: (params: { status: AlertStatus; title: string; description?: string }) => void;
}) => {
  const username = useStore((state) => state.user.username);

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    relationship: 'errata',
    otherRelationship: '',
    mainBibcode: '',
    associatedBibcodes: [],
  };

  const formikRef = useRef<FormikProps<FormValues>>();

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
    const { email, name, relationship, otherRelationship, mainBibcode, associatedBibcodes } = formikRef.current.values;

    // set params will trigger opening preview
    setParams({
      origin: 'user_submission',
      _subject: 'Associated Articles',
      name,
      email,
      'g-recaptcha-response': null,
      source: mainBibcode,
      target: associatedBibcodes,
      relationship: relationship,
      custom_name: otherRelationship.length === 0 ? undefined : otherRelationship,
    });
  };

  // submitted
  const handleOnSuccess = () => {
    onOpenAlert({ status: 'success', title: 'Feedback submitted successfully' });
    formikRef.current.resetForm();
  };

  // submission error
  const handleError = (error: string) => {
    onOpenAlert({ status: 'error', title: error });
  };

  return (
    <Formik initialValues={initialFormValues} onSubmit={handlePreview} innerRef={formikRef}>
      {({ values }) => (
        <>
          <Form>
            <Flex direction="column" gap={4} my={2}>
              <HStack gap={2}>
                <Field name="name">
                  {({ field }: FieldProps) => (
                    <FormControl isRequired>
                      <FormLabel>Name</FormLabel>
                      <Input {...field} autoFocus />
                    </FormControl>
                  )}
                </Field>
                <Field name="email">
                  {({ field }: FieldProps) => (
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input {...field} type="email" />
                    </FormControl>
                  )}
                </Field>
              </HStack>
              <AssociatedTable />
              <HStack mt={2}>
                <Button type="submit">Preview</Button>
                <Button type="reset" variant="outline">
                  Reset
                </Button>
              </HStack>
            </Flex>
          </Form>
          {/* intentionally make this remount each time so that recaptcha is regenerated */}
          {isPreviewOpen && (
            <PreviewModal
              params={params}
              isOpen={true}
              title="Preview Associated Articles Request"
              submitterInfo={JSON.stringify({ name: values.name, email: values.email }, null, 2)}
              mainContentTitle="Correlated Articles"
              mainContent={JSON.stringify(omit(['name', 'email'], values), null, 2)}
              onClose={closePreview}
              onSuccess={handleOnSuccess}
              onError={handleError}
            />
          )}
        </>
      )}
    </Formik>
  );
};

const relationOptions: SelectOption<Relationship>[] = [
  { id: 'errata', value: 'errata', label: 'Main Paper/Errata' },
  { id: 'addenda', value: 'addenda', label: 'Main Paper/Addenda' },
  { id: 'series', value: 'series', label: 'Series of Articles' },
  { id: 'arxiv', value: 'arxiv', label: 'arXiv/Published' },
  { id: 'other', value: 'other', label: 'Other' },
];

export const AssociatedTable = () => {
  const [newAssociatedBibcode, setNewAssociatedBibcode] = useState('');

  const mainBibcodeRef = useRef<HTMLInputElement>();

  const newAssociatedBibcodeRef = useRef<HTMLInputElement>();

  const [relationshipField, , relationshipHelpers] = useField<string>({
    name: 'relationship',
    validate: (value: FormValues['relationship']) => {
      if (!value) {
        return 'This field is required';
      }
    },
  });

  const relationType = relationshipField.value;

  const [assoBibcodesField] = useField<string[]>({
    name: 'associatedBibcodes',
    validate: (value: FormValues['associatedBibcodes']) => {
      if (!value || value.length === 0) {
        return 'This field requires at least one entry';
      }
    },
  });

  const associatedBibcodes = assoBibcodesField.value;

  const handleNewAssociatedBibcodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAssociatedBibcode(e.target.value);
  };

  const handleRelationshipChange = (option: SelectOption<string>) => {
    relationshipHelpers.setValue(option.value);
    mainBibcodeRef.current.focus();
  };

  return (
    <>
      <Field name="relationship">
        {({ field, form }: FieldProps) => (
          <FormControl isRequired isInvalid={!!form.errors.relationship && !!form.touched.relationship}>
            <FormLabel>Relation Type</FormLabel>
            <Select<SelectOption<string>>
              options={relationOptions}
              value={relationOptions.find((o) => o.value === field.value) ?? null}
              name="relation-type"
              label="Relation Type"
              id="relation-options"
              stylesTheme="default"
              onChange={handleRelationshipChange}
            />
            <FormErrorMessage>{form.errors.relationship}</FormErrorMessage>
          </FormControl>
        )}
      </Field>
      {relationType !== null && (
        <>
          {relationType === 'other' && (
            <Field name="otherRelationship">
              {({ field }: FieldProps) => (
                <FormControl isRequired>
                  <FormLabel>Custom Relation Type</FormLabel>
                  <Input {...field} />
                </FormControl>
              )}
            </Field>
          )}
          <Field name="mainBibcode">
            {({ field }: FieldProps) => (
              <FormControl isRequired>
                <FormLabel>{`${
                  relationType === 'arxiv' ? 'arXiv ' : relationType === 'other' ? '' : 'Main Paper '
                }Bibcode`}</FormLabel>
                <Input {...field} ref={mainBibcodeRef} />
              </FormControl>
            )}
          </Field>
          <FieldArray name="associatedBibcodes">
            {({ remove, push, form }: FieldArrayRenderProps) => (
              <FormControl
                isInvalid={typeof form.errors.associatedBibcodes === 'string' && !!form.touched.associatedBibcodes}
              >
                <FormLabel>{`${
                  relationType === 'errata'
                    ? 'Errata '
                    : relationType === 'addenda'
                    ? 'Addenda '
                    : relationType === 'series'
                    ? 'Series of articles '
                    : relationType === 'arxiv'
                    ? 'Main paper '
                    : 'Related '
                }Bibcode(s)`}</FormLabel>
                <Flex direction="column" gap={2}>
                  {associatedBibcodes.map((b, index) => (
                    <HStack key={`asso-bib-${index}`}>
                      <Input defaultValue={b} />
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
                  ))}
                  <FormErrorMessage>{form.errors.associatedBibcodes}</FormErrorMessage>
                  <HStack>
                    <Input
                      onChange={handleNewAssociatedBibcodeChange}
                      value={newAssociatedBibcode}
                      ref={newAssociatedBibcodeRef}
                    />
                    <IconButton
                      aria-label="Add"
                      variant="outline"
                      size="md"
                      colorScheme="green"
                      onClick={() => {
                        push(newAssociatedBibcode);
                        setNewAssociatedBibcode('');
                        newAssociatedBibcodeRef.current.focus();
                      }}
                      isDisabled={!newAssociatedBibcode}
                    >
                      <AddIcon />
                    </IconButton>
                  </HStack>
                </Flex>
              </FormControl>
            )}
          </FieldArray>
        </>
      )}
    </>
  );
};
