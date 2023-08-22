import { IUserCredentials } from '@api';
import { Button, Container, FormControl, FormLabel, Heading, Input, InputGroup, Stack } from '@chakra-ui/react';
import { PasswordTextInput, SimpleLink, StandardAlertMessage } from '@components';
import { NextPage } from 'next';
import Head from 'next/head';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { ILoginResponse } from '@pages/api/auth/login';
import { useRedirectWithNotification } from '@components/Notification';
import { useFocus } from '@lib/useFocus';
import { useUser } from '@lib/useUser';
import { parseAPIError } from '@utils';

const initialParams: IUserCredentials = { email: '', password: '' };

const Login: NextPage = () => {
  const [params, setParams] = useState<IUserCredentials>(initialParams);
  const [mainInputRef, focus] = useFocus<HTMLInputElement>();
  const redirectToRoot = useRedirectWithNotification();
  const { reset: resetUser } = useUser();

  const {
    mutate: submit,
    data,
    isError,
    isLoading,
    error,
  } = useMutation<ILoginResponse, AxiosError<ILoginResponse> | Error, IUserCredentials>(
    ['login'],
    async (params) => {
      const { data } = await axios.post<ILoginResponse>('/api/auth/login', params);
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    },
    {
      cacheTime: 0,
      retry: false,
    },
  );

  // redirect on successful login
  useEffect(() => {
    if (data?.success) {
      resetUser().finally(() => void redirectToRoot('account-login-success'));
    }
  }, [data?.success, redirectToRoot, resetUser]);

  const handleChange: FormEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    setParams((prevParams) => ({ ...prevParams, [name]: value }));
  };

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (event) => {
      event.preventDefault();
      submit(params);
    },
    [params, submit],
  );

  useEffect(() => {
    if (isError) {
      focus();
    }
  }, [isError]);

  return (
    <>
      <Head>
        <title>NASA Science Explorer - Login</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading as="h2" id="form-label" alignSelf="center" my="6">
          Login
        </Heading>

        <form onSubmit={handleSubmit} aria-labelledby="form-label">
          <Stack direction="column" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                ref={mainInputRef}
                type="text"
                placeholder="email@example.com"
                name="email"
                id="email"
                autoFocus
                onChange={handleChange}
                value={params.email}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <PasswordTextInput
                  name="password"
                  id="password"
                  pr="4.5rem"
                  onChange={handleChange}
                  value={params.password}
                />
              </InputGroup>
            </FormControl>
            <SimpleLink alignSelf="flex-end" href="/user/account/forgotpassword">
              Forgot password?
            </SimpleLink>
            <Button type="submit" isLoading={isLoading}>
              Submit
            </Button>
            {isLoading ? null : (
              <SimpleLink alignSelf="center" href="/user/account/register">
                Register
              </SimpleLink>
            )}
          </Stack>
        </form>
        <LoginErrorMessage error={error} />
      </Container>
    </>
  );
};

const LoginErrorMessage = (props: { error: AxiosError<ILoginResponse> | Error }) => {
  switch (parseAPIError(props.error) as ILoginResponse['error']) {
    case 'login-failed':
    case 'invalid-credentials':
      return (
        <StandardAlertMessage
          status="error"
          title="Invalid credentials"
          description="The email or password you entered is incorrect."
        />
      );
    case 'failed-userdata-request':
    case 'invalid-token':
      return <StandardAlertMessage status="error" title="Unable to login" description="Please try again later." />;
    default:
      return null;
  }
};

export default Login;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
