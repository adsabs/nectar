import { Button, Flex, FormControl, FormLabel, Input, Textarea, Text, HStack, useToast } from '@chakra-ui/react';
import { FeedbackLayout } from '@components';
import { useStore } from '@store';
import { Field, FieldProps, Form, Formik, FormikHelpers } from 'formik';
import { NextPage } from 'next';

type FormValues = {
  name: string;
  email: string;
  feedback: string;
};

const General: NextPage = () => {
  const toast = useToast({ duration: 3000 });
  const username = useStore((state) => state.getUsername());

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    feedback: '',
  };

  const handleSubmitForm = (values: FormValues, { setSubmitting, resetForm }: FormikHelpers<FormValues>) => {
    toast({ status: 'success', title: 'Successfully submitted' });
    setSubmitting(false);
    resetForm();
  };

  return (
    <FeedbackLayout title="General Feedback">
      <Text my={2}>
        You can also reach us at <strong>adshelp [at] cfa.harvard.edu</strong>
      </Text>
      <Formik initialValues={initialFormValues} onSubmit={handleSubmitForm}>
        {(props) => (
          <Form>
            <Flex direction="column" gap={2}>
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
              <Field name="feedback">
                {({ field }: FieldProps) => (
                  <FormControl isRequired>
                    <FormLabel>Feedback</FormLabel>
                    <Textarea {...field} />
                  </FormControl>
                )}
              </Field>
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
    </FeedbackLayout>
  );
};

export default General;
