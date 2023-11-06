/* eslint-disable @typescript-eslint/no-misused-promises */
import { useFeedback } from '@api/feedback';
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
import { FeedbackAlert, FeedbackLayout, RecaptchaMessage } from '@components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore } from '@store';
import { makeSearchParams, parseAPIError } from '@utils';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { MouseEvent, useCallback, useState } from 'react';
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
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormMessage } from '@components/Feedbacks/FormMessage';
import { useGetUserEmail } from '@lib';

type FormValues = {
  name: string;
  email: string;
  comments: string;
};

const validationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  comments: z.string().min(1, 'Feedback is required'),
});

const General: NextPage = () => {
  const userEmail = useGetUserEmail();
  const currentQuery = useStore((state) => state.latestQuery);
  const [formError, setFormError] = useState<Error | string | null>(null);

  const [alertDetails, setAlertDetails] = useState<{ status: AlertStatus; title: string; description?: string }>({
    status: 'success',
    title: '',
  });

  const { executeRecaptcha } = useGoogleReCaptcha();
  const { isOpen: isAlertOpen, onClose: onAlertClose, onOpen: onAlertOpen } = useDisclosure();

  const initialFormValues: FormValues = {
    name: '',
    email: userEmail ?? '',
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
    formState: { errors },
    reset,
    handleSubmit,
  } = formMethods;

  const { mutate, isLoading } = useFeedback();

  const router = useRouter();

  const onSubmit = useCallback<SubmitHandler<FormValues>>(
    async (params) => {
      if (params === null) {
        setFormError('Form is invalid');
        return;
      }

      if (!executeRecaptcha) {
        setFormError('ReCAPTCHA was not loaded properly, please refresh the page and try again.');
        return;
      }

      const { name, email, comments } = params;
      try {
        const recaptchaToken = await executeRecaptcha('feedback');

        const platform = isDesktop ? 'desktop' : isMobile ? 'mobile' : 'others';

        mutate(
          {
            name,
            _replyto: email,
            _subject: 'Nectar Feedback',
            'feedback-type': 'feedback',
            'user-agent-string': globalThis?.navigator?.userAgent,
            origin: 'bbb_feedback', // indicate general feedback
            'g-recaptcha-response': recaptchaToken,
            currentuser: userEmail ?? 'anonymous',
            'browser.name': browserName,
            'browser.version': browserVersion,
            engine: `${engineName} ${engineVersion}`,
            platform,
            os: `${osName} ${osVersion}`,
            current_page: router.query.from ? (router.query.from as string) : undefined,
            current_query: makeSearchParams(currentQuery),
            url: router.asPath,
            comments,
          },
          {
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
            },
          },
        );
      } catch (e) {
        setFormError(e as Error);
      }
    },
    [
      executeRecaptcha,
      mutate,
      onAlertOpen,
      reset,
      makeSearchParams,
      currentQuery,
      router.query.from,
      router.asPath,
      userEmail,
      engineName,
      engineVersion,
      osName,
      osVersion,
      browserName,
      browserVersion,
      isDesktop,
      isMobile,
      globalThis?.navigator?.userAgent,
    ],
  );

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

          <HStack mt={2}>
            <Button type="submit" isLoading={isLoading}>
              Submit
            </Button>
            <Button type="reset" variant="outline" isDisabled={isLoading} onClick={handleReset}>
              Reset
            </Button>
          </HStack>
          <RecaptchaMessage />
        </Flex>
        <FormMessage show={!!formError} title="Unable to submit form" error={formError} />
      </form>
    </FeedbackLayout>
  );
};

export default General;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
