import { Button, Container, FormControl, FormLabel, Heading, Input, InputGroup, Stack } from '@chakra-ui/react';

import { NextPage } from 'next';
import Head from 'next/head';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { ILoginResponse } from '@/pages/api/auth/login';
import { useFocus } from '@/lib/useFocus';
import { useUser } from '@/lib/useUser';
import { useRouter } from 'next/router';
import { BRAND_NAME_FULL } from '@/config';
import { PasswordTextInput } from '@/components/TextInput';
import { SimpleLink } from '@/components/SimpleLink';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IUserCredentials } from '@/api/user/types';

const initialParams: IUserCredentials = { email: '', password: '' };

const Login: NextPage = () => {
  const { reload } = useRouter();
  const [params, setParams] = useState<IUserCredentials>(initialParams);
  const [mainInputRef, focus] = useFocus<HTMLInputElement>();
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
      reload();
    }
  }, [data?.success, reload, resetUser]);

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
  }, [isError, focus]);

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME_FULL} Login`}</title>
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
            {/* show loading indicator even after success, since we should be awaiting a page refresh */}
            <Button type="submit" isLoading={isLoading || data?.success}>
              Submit
            </Button>
            {isLoading || data?.success ? null : (
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
    case 'must-reset-credentials':
      return (
        <StandardAlertMessage
          status="error"
          title="Please reset your password"
          description="Your password does not meet the new security requirements. An email has been sent to you with instructions on how to reset your password."
        />
      );
    default:
      return null;
  }
};

export default Login;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
