import { IUserForgotPasswordCredentials } from '@api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
} from '@chakra-ui/react';
import { useSession } from '@lib/auth';
import { getDefaultReducer } from '@lib/auth/model';
import { IAuthForm } from '@lib/auth/types';
import { useForgotPassword } from '@lib/auth/useForgotPassword';
import { useRecaptcha } from '@lib/useRecaptcha';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEvent, useReducer } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';
export { useQuery } from '@tanstack/react-query';

const initialState: IAuthForm<IUserForgotPasswordCredentials> = {
  params: { email: '', recaptcha: null },
  status: 'idle',
  error: null,
};

const defaultFormReducer = getDefaultReducer(initialState);

const ForgotPassword: NextPage = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(defaultFormReducer, initialState);
  const { isAuthenticated } = useSession();

  const { getRecaptchaProps } = useRecaptcha({
    enabled: state.status === 'submitting',
    onExecute: (recaptcha) => dispatch({ type: 'setRecaptcha', recaptcha }),
    onError: (error) => dispatch({ type: 'setError', error }),
  });

  useForgotPassword(state.params, {
    onError: (msg) => dispatch({ type: 'setError', error: msg.error }),
    enabled: state.params.recaptcha !== null && state.status === 'submitting',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch({ type: 'submit' });
  };

  // if already authenticated, redirect immediately
  if (isAuthenticated) {
    void router.push('/', null, { shallow: false });
    return null;
  }

  return (
    <>
      <Head>
        <title>NASA Science Explorer - Forgot Password</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Forgot Password</Heading>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <ReCAPTCHA {...getRecaptchaProps()} />
          <Stack direction="column" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="text"
                placeholder="email@example.com"
                name="email"
                id="email"
                onChange={(e) => dispatch({ type: 'setEmail', email: e.currentTarget.value })}
                value={state.params.email}
                autoFocus
                required
              />
              <FormErrorMessage>Error message</FormErrorMessage>
            </FormControl>
            <Button type="submit" isLoading={state.status === 'submitting'}>
              Submit
            </Button>
            {state.status === 'error' && (
              <Alert status="error">
                <AlertTitle>Unable to complete request</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </Container>
    </>
  );
};

export default ForgotPassword;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
