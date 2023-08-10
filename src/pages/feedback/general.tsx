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
import { yupResolver } from '@hookform/resolvers/yup';
import { useRecaptcha } from '@lib/useRecaptcha';
import { useStore } from '@store';
import { parseAPIError } from '@utils';
import { NextPage } from 'next';
import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useForm } from 'react-hook-form';
import { v4 } from 'uuid';
import * as Yup from 'yup';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

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

  const [uuid, setUuid] = useState(v4()); // use this to force remount MyRecaptcha to generate new value

  const [state, setState] = useState<State>('idle');

  const [recaptcha, setRecaptcha] = useState<string>(null);

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
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register,
    getValues,
    formState: { errors },
    reset,
  } = formMethods;

  // submit feedback
  const { isFetching, isSuccess, error, refetch } = useFeedback(
    { ...params, 'g-recaptcha-response': recaptcha } as IFeedbackParams,
    {
      enabled: false,
    },
  );

  useEffect(() => {
    if (state === 'idle') {
      // reset
      setParams(null);
      setUuid(v4());
    } else if (state === 'submitting') {
      const { name, email, comments } = getValues();
      setParams({
        name,
        _replyto: email,
        _subject: 'Nectar Feedback',
        'feedback-type': 'feedback',
        'user-agent-string': navigator.userAgent,
        origin: 'bbb_feedback', // indicate general feedback
        'g-recaptcha-response': null,
        comments,
      });
    }
  }, [state]);

  useEffect(() => {
    if (params !== null && !!recaptcha) {
      void refetch();
    }
  }, [params, recaptcha]);

  useEffect(() => {
    if (!isFetching) {
      if (isSuccess) {
        setAlertDetails({
          status: 'success',
          title: 'Feedback submitted successfully',
        });
        reset(initialFormValues);
        onAlertOpen();
        setState('idle');
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

  const handleRecaptcha = (r: string) => {
    setRecaptcha(r);
  };

  const handleRecaptchaError = (error: string) => {
    setAlertDetails({
      status: 'error',
      title: error,
    });
    setRecaptcha(null);
    onAlertOpen();
    setState('idle');
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      <form onSubmit={handleSubmit}>
        <Text my={2}>
          You can also reach us at <strong>adshelp [at] cfa.harvard.edu</strong>
        </Text>
        <Recaptcha onRecaptcha={handleRecaptcha} onError={handleRecaptchaError} key={uuid} />
        {/* <ReCAPTCHA {...getRecaptchaProps()} key={uuid} /> */}
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
            <Button type="submit" isLoading={state !== 'idle'}>
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
