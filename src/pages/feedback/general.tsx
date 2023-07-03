import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Text,
  HStack,
  useDisclosure,
  AlertStatus,
} from '@chakra-ui/react';
import { FeedbackLayout, FeedbackAlert } from '@components';
import { useStore } from '@store';
import { Field, FieldProps, Form, Formik, FormikHelpers } from 'formik';
import { NextPage } from 'next';
import { useState } from 'react';

type FormValues = {
  name: string;
  email: string;
  feedback: string;
};

const General: NextPage = () => {
  const username = useStore((state) => state.getUsername());

  const [alertDetails, setAlertDetails] = useState<{ status: AlertStatus; title: string; description?: string }>({
    status: 'success',
    title: '',
  });

  const { isOpen: isAlertOpen, onClose: onAlertClose, onOpen: onAlertOpen } = useDisclosure();

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    feedback: '',
  };

  const handleSubmitForm = (values: FormValues, { setSubmitting, resetForm }: FormikHelpers<FormValues>) => {
    setAlertDetails({
      status: 'success',
      title: 'Feedback successfully submitted',
    });
    onAlertOpen();
    setSubmitting(false);
    resetForm();
  };

  const alert = (
    <FeedbackAlert
      isOpen={isAlertOpen}
      onClose={onAlertClose}
      status={alertDetails.status}
      title={alertDetails.title}
      description={alertDetails.description}
      my={4}
    />
  );

  return (
    <FeedbackLayout title="General Feedback" alert={alert}>
      <Text my={2}>
        You can also reach us at <strong>adshelp [at] cfa.harvard.edu</strong>
      </Text>
      <Formik initialValues={initialFormValues} onSubmit={handleSubmitForm}>
        {(props) => (
          <Form>
            <Flex direction="column" gap={4}>
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
