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
import { Formik, Form, Field, useField, FieldArray, FieldProps, FieldArrayRenderProps } from 'formik';
import { omit } from 'ramda';
import { useState, ChangeEvent, useRef } from 'react';
import { PreviewModal } from '../PreviewModal';

type FormValues = {
  name: string;
  email: string;
  relationship: string;
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

  const [formValues, setFormValues] = useState<FormValues>(null);

  const { isOpen: isPreviewOpen, onOpen: openPreview, onClose: closePreview } = useDisclosure();

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    relationship: 'errata',
    otherRelationship: null,
    mainBibcode: '',
    associatedBibcodes: [],
  };

  const handlePreview = (values: FormValues) => {
    setFormValues(values);
    openPreview();
  };

  const handleSubmitForm = (setSubmitting: (s: boolean) => void, resetForm: () => void) => {
    console.log(formValues);
    closePreview();
    onOpenAlert({
      status: 'success',
      title: 'Feedback successfully submitted',
    });
    resetForm();
  };

  return (
    <Formik initialValues={initialFormValues} onSubmit={handlePreview}>
      {({ values, setSubmitting, resetForm }) => (
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
          <PreviewModal
            isOpen={isPreviewOpen}
            title="Preview Associated Articles Request"
            submitterInfo={JSON.stringify({ name: values.name, email: values.email }, null, 2)}
            mainContentTitle="Correlated Articles"
            mainContent={JSON.stringify(omit(['name', 'email'], values), null, 2)}
            onSubmit={() => handleSubmitForm(setSubmitting, resetForm)}
            onClose={closePreview}
          />
        </>
      )}
    </Formik>
  );
};

const relationOptions: SelectOption<string>[] = [
  { id: 'errata', value: 'errata', label: 'Main Paper/Errata' },
  { id: 'addenda', value: 'addenda', label: 'Main Paper/Addenda' },
  { id: 'series', value: 'series', label: 'Series of Articles' },
  { id: 'arxiv', value: 'arxiv', label: 'arXiv/Published' },
  { id: 'other', value: 'other', label: 'Other' },
];

export const AssociatedTable = () => {
  const [newAssociatedBibcode, setNewAssociatedBibcode] = useState('');

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
  };

  return (
    <>
      <Field name="relationship">
        {({ field, form }: FieldProps) => (
          <FormControl isRequired isInvalid={!!form.errors.relationship && !!form.touched.relationship}>
            <FormLabel>Relation Type</FormLabel>
            <Select<SelectOption<string>>
              options={relationOptions}
              value={relationOptions.find((o) => o.value === field.value)}
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
                <Input {...field} autoFocus />
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
