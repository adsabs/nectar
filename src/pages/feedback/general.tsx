import { IFeedbackParams, useFeedback } from '@api/feedback';
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
import { useRecaptcha } from '@lib/useRecaptcha';
import { useStore } from '@store';
import { parseAPIError } from '@utils';
import { Field, FieldProps, Form, Formik, FormikProps } from 'formik';
import { NextPage } from 'next';
import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { v4 } from 'uuid';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

type FormValues = {
  name: string;
  email: string;
  feedback: string;
};

const General: NextPage = () => {
  const username = useStore((state) => state.user.username);

  const [params, setParams] = useState<IFeedbackParams>(null);

  const [recaptcha, setRecaptcha] = useState<string>(null);

  const [uuid, setUuid] = useState(v4()); // use this to force remount MyRecaptcha to generate new value

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

  const formikRef = useRef<FormikProps<FormValues>>();

  // trigger when recaptcha is generated
  const { isLoading, isSuccess, error } = useFeedback(
    { ...params, 'g-recaptcha-response': recaptcha } as IFeedbackParams,
    {
      enabled: !!params && !!recaptcha,
    },
  );

  useEffect(() => {
    if (!isLoading) {
      formikRef.current.setSubmitting(false);

      if (isSuccess) {
        setAlertDetails({
          status: 'success',
          title: 'Feedback submitted successfully',
        });

        formikRef.current.resetForm();
      } else {
        setAlertDetails({
          status: 'error',
          title: parseAPIError(error),
        });
      }
      onAlertOpen();

      // reset
      setRecaptcha(null);
      setParams(null);
      setUuid(v4());
    }
  }, [isLoading, isSuccess]);

  const handleSubmitForm = (values: FormValues) => {
    // set params to enable sending query
    setParams({
      name: values.name,
      _replyto: values.email,
      _subject: 'Nectar Feedback',
      'feedback-type': 'feedback',
      'user-agent-string': navigator.userAgent,
      origin: 'bbb_feedback', // indicate general feedback
      'g-recaptcha-response': null,
      comments: values.feedback,
    });
  };

  const handleRecaptcha = (r: string) => {
    setRecaptcha(r);
  };

  const handleRecaptchaError = (e: string) => {
    setAlertDetails({
      status: 'error',
      title: e,
    });
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
      <Formik initialValues={initialFormValues} onSubmit={handleSubmitForm} innerRef={formikRef}>
        {(props) => (
          <Form>
            <Recaptcha onRecaptcha={handleRecaptcha} onError={handleRecaptchaError} key={uuid} />
            <Flex direction="column" gap={4}>
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
                <Button type="reset" variant="outline" isDisabled={props.isSubmitting}>
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

const Recaptcha = ({
  onRecaptcha,
  onError,
}: {
  onRecaptcha: (recaptcha: string) => void;
  onError: (error: string) => void;
}) => {
  const { getRecaptchaProps } = useRecaptcha({
    onExecute: (r) => {
      onRecaptcha(r);
    },
    onError: (error) => {
      onError(parseAPIError(error));
    },
    enabled: true,
  });
  return <ReCAPTCHA {...getRecaptchaProps()} />;
};
