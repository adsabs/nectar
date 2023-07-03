import { Flex, HStack, FormControl, FormLabel, Input, Button, AlertStatus } from '@chakra-ui/react';
import { useStore } from '@store';
import { Field, FieldProps, Form, Formik, FormikHelpers } from 'formik';
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
  const username = useStore((state) => state.getUsername());

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    references: [],
  };

  const handleSubmitForm = (values: FormValues, { setSubmitting, resetForm }: FormikHelpers<FormValues>) => {
    console.log(values);
    onOpenAlert({
      status: 'success',
      title: 'Feedback successfully submitted',
    });
    setSubmitting(false);
    resetForm();
  };

  return (
    <Formik initialValues={initialFormValues} onSubmit={handleSubmitForm}>
      {(props) => (
        <Form>
          <Flex direction="column" gap={4} my={2}>
            <HStack gap={2}>
              <Field name="name">
                {({ field }: FieldProps) => (
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input {...field} />
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
              <Button type="submit" isLoading={props.isSubmitting}>
                Submit
              </Button>
              <Button type="reset" variant="outline">
                Reset
              </Button>
            </HStack>
          </Flex>
        </Form>
      )}
    </Formik>
  );
};
