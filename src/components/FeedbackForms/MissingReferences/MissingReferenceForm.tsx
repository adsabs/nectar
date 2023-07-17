import { Flex, HStack, FormControl, FormLabel, Input, Button, AlertStatus, useDisclosure } from '@chakra-ui/react';
import { useStore } from '@store';
import { Field, FieldProps, Form, Formik } from 'formik';
import { omit } from 'ramda';
import { useState } from 'react';
import { PreviewModal } from '../PreviewModal';
import { MissingReferenceTable } from './MissingReferenceTable';

type FormValues = {
  name: string;
  email: string;
  references: [string, string][];
};

export const MissingReferenceForm = ({
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
    references: [],
  };

  const handlePreview = (values: FormValues) => {
    setFormValues(values);
    openPreview();
  };

  const handleSubmitForm = (setSubmitting: (s: boolean) => void, resetForm: () => void) => {
    console.log(formValues);
    closePreview();
    window.scrollTo(0, 0);
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
                      <Input type="email" {...field} />
                    </FormControl>
                  )}
                </Field>
              </HStack>
              <MissingReferenceTable />
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
            title="Preview Missing Reference Feedback"
            submitterInfo={JSON.stringify({ name: values.name, email: values.email }, null, 2)}
            mainContentTitle="Missing References"
            mainContent={JSON.stringify(omit(['name', 'email'], values), null, 2)}
            onSubmit={() => handleSubmitForm(setSubmitting, resetForm)}
            onClose={closePreview}
          />
        </>
      )}
    </Formik>
  );
};
