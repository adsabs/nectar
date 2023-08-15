/* eslint-disable @typescript-eslint/no-misused-promises */
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
  FormErrorMessage,
} from '@chakra-ui/react';
import { FeedbackLayout, FeedbackAlert } from '@components';
import { GOOGLE_RECAPTCHA_KEY } from '@config';
import { yupResolver } from '@hookform/resolvers/yup';
import { useStore } from '@store';
import { parseAPIError } from '@utils';
import { NextPage } from 'next';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useForm } from 'react-hook-form';
import * as Yup from 'yup';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

// TODO: include these information in the feedback
// platform, url, browser, current query, current user, browser

type FormValues = {
  name: string;
  email: string;
  comments: string;
};

type State = 'idle' | 'submitting';

const validationSchema: Yup.ObjectSchema<FormValues> = Yup.object({
  name: Yup.string().required(),
  email: Yup.string().email().required(),
  comments: Yup.string().required(),
});

const General: NextPage = () => {
  const username = useStore((state) => state.user.username);

  const [params, setParams] = useState<IFeedbackParams>(null);

  const [token, setToken] = useState<string>(null);

  const [state, setState] = useState<State>('idle');

  const [alertDetails, setAlertDetails] = useState<{ status: AlertStatus; title: string; description?: string }>({
    status: 'success',
    title: '',
  });

  const { isOpen: isAlertOpen, onClose: onAlertClose, onOpen: onAlertOpen } = useDisclosure();

  const initialFormValues: FormValues = {
    name: '',
    email: username ?? '',
    comments: '',
  };

  const formMethods = useForm<FormValues>({
    defaultValues: initialFormValues,
    resolver: yupResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    shouldFocusError: true,
  });

  const {
    register,
    getValues,
    formState: { errors },
    reset,
    handleSubmit,
  } = formMethods;

  // submit feedback
  const { isFetching, isSuccess, error, refetch } = useFeedback(params, {
    enabled: false,
  });

  const recaptchaRef = useRef<ReCAPTCHA>();

  useEffect(() => {
    if (state === 'idle') {
      // reset
      setParams(null);
      setToken(null);
      recaptchaRef.current.reset();
    } else if (state === 'submitting') {
      const token = recaptchaRef.current.getValue();
      const { name, email, comments } = getValues();

      setParams({
        name,
        _replyto: email,
        _subject: 'Nectar Feedback',
        'feedback-type': 'feedback',
        'user-agent-string': navigator.userAgent,
        origin: 'bbb_feedback', // indicate general feedback
        'g-recaptcha-response': token,
        comments,
      });
    }
  }, [state]);

  useEffect(() => {
    if (params !== null && state === 'submitting') {
      void refetch();
    }
  }, [params, state]);

  useEffect(() => {
    if (!isFetching) {
      if (isSuccess) {
        setAlertDetails({
          status: 'success',
          title: 'Feedback submitted successfully',
        });
        reset(initialFormValues);
        onAlertOpen();
      } else if (error) {
        setAlertDetails({
          status: 'error',
          title: parseAPIError(error),
        });
        onAlertOpen();
      }
      setState('idle');
    }
  }, [isFetching, isSuccess, error]);

  const onSubmit = () => {
    setState('submitting');
  };

  const handleReset = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    reset(initialFormValues);
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Text my={2}>
          You can also reach us at <strong>adshelp [at] cfa.harvard.edu</strong>
        </Text>
        <Flex direction="column" gap={4}>
          <HStack gap={2}>
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel>Name</FormLabel>
              <Input {...register('name', { required: true })} autoFocus />
              <FormErrorMessage>{errors.name && errors.name.message}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input {...register('email', { required: true })} type="email" />
              <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
            </FormControl>
          </HStack>

          <FormControl isRequired isInvalid={!!errors.comments}>
            <FormLabel>Feedback</FormLabel>
            <Textarea {...register('comments', { required: true })} />
            <FormErrorMessage>{errors.comments && errors.comments.message}</FormErrorMessage>
          </FormControl>

          <ReCAPTCHA ref={recaptchaRef} sitekey={GOOGLE_RECAPTCHA_KEY} onChange={setToken} />

          <HStack mt={2}>
            <Button type="submit" isLoading={state !== 'idle'} isDisabled={token === null}>
              Submit
            </Button>
            <Button type="reset" variant="outline" isDisabled={state !== 'idle'} onClick={handleReset}>
              Reset
            </Button>
          </HStack>
        </Flex>
      </form>
    </FeedbackLayout>
  );
};

export default General;
