/* eslint-disable @typescript-eslint/no-misused-promises */
import { IFeedbackParams, useFeedback } from '@api/feedback';
import {
  AlertStatus,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Text,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { FeedbackAlert, FeedbackLayout } from '@components';
import { GOOGLE_RECAPTCHA_KEY } from '@config';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore } from '@store';
import { makeSearchParams, parseAPIError } from '@utils';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import {
  browserName,
  browserVersion,
  engineName,
  engineVersion,
  isDesktop,
  isMobile,
  osName,
  osVersion,
} from 'react-device-detect';
import ReCAPTCHA from 'react-google-recaptcha';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type FormValues = {
  name: string;
  email: string;
  comments: string;
};

type State = 'idle' | 'submitting';

const validationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  comments: z.string().min(1, 'Feedback is required'),
});

const General: NextPage = () => {
  const username = useStore((state) => state.user.username);

  const [params, setParams] = useState<IFeedbackParams>(null);

  const [token, setToken] = useState<string>(null);

  const [state, setState] = useState<State>('idle');

  const currentQuery = useStore((state) => state.latestQuery);

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
    resolver: zodResolver(validationSchema),
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
  const { mutate } = useFeedback();

  const recaptchaRef = useRef<ReCAPTCHA>();

  const router = useRouter();

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
        currentuser: username ?? 'anonymous',
        'browser.name': browserName,
        'browser.version': browserVersion,
        engine: `${engineName} ${engineVersion}`,
        platform: isDesktop ? 'desktop' : isMobile ? 'mobile' : 'others',
        os: `${osName} ${osVersion}`,
        current_page: router.query.from ? (router.query.from as string) : undefined,
        current_query: makeSearchParams(currentQuery),
        url: router.asPath,
        comments,
      });
    }
  }, [state]);

  useEffect(() => {
    if (params !== null && state === 'submitting') {
      void mutate(params, {
        onSettled: (_data, error) => {
          if (error) {
            setAlertDetails({
              status: 'error',
              title: parseAPIError(error),
            });
          } else {
            setAlertDetails({
              status: 'success',
              title: 'Feedback submitted successfully',
            });
            reset(initialFormValues);
          }
          onAlertOpen();
          setState('idle');
        },
      });
    }
  }, [params, state]);

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
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
