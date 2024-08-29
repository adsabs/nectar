import { Button, Center, Container, FormControl, FormLabel, Heading, Input, InputGroup, Stack } from '@chakra-ui/react';
import type { NectarLoginErrorResponse, NectarLoginPayload, NectarLoginResponse } from '@server/routes/login';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { NextPage } from 'next';
import Head from 'next/head';
import { FormEventHandler, useCallback, useEffect, useRef } from 'react';

import { ApiTargets, ICSRFResponse } from '@/api';
import api from '@/api/api';
import { FeedbackAlert, PasswordTextInput, SimpleLink } from '@/components';
import { BRAND_NAME_FULL } from '@/config';
import { logger } from '@/logger';

const Login: NextPage = () => {
  const form = useRef<HTMLFormElement | null>(null);
  const {
    mutate: login,
    data,
    error,
    isError,
    isLoading,
  } = useMutation<NectarLoginResponse, NectarLoginErrorResponse, NectarLoginPayload['credentials']>(
    ['login'],
    async (credentials) => {
      const { data: csrfResponse } = await api.request<ICSRFResponse>({
        url: ApiTargets.CSRF,
        method: 'GET',
      });

      const body: NectarLoginPayload = {
        credentials,
        csrf: csrfResponse?.csrf,
      };

      const { data } = await axios.post<NectarLoginResponse | NectarLoginErrorResponse>('/api/auth/login', body);
      return data;
    },
  );

  const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();

      if (form.current === null || isLoading) {
        return;
      }
      const formdata = new FormData(form.current);
      login({
        email: formdata.get('email') as string,
        password: formdata.get('password') as string,
      });
    },
    [isLoading],
  );

  useEffect(() => {
    logger.debug({ data, error, isError, isLoading });
  }, [data, error, isError, isLoading]);

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME_FULL} Login`}</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading as="h2" id="form-label" alignSelf="center" my="6">
          Login
        </Heading>

        <form aria-labelledby="form-label" onSubmit={onSubmit} ref={form}>
          <Stack direction="column" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="text" placeholder="email@example.com" name="email" id="email" disabled={isLoading} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <PasswordTextInput name="password" id="password" pr="4.5rem" disabled={isLoading} />
              </InputGroup>
            </FormControl>
            <SimpleLink alignSelf="flex-end" href="/user/account/forgotpassword">
              Forgot password?
            </SimpleLink>
            {/* show loading indicator even after success, since we should be awaiting a page refresh */}
            <Button type="submit" disabled={isLoading}>
              Submit
            </Button>
          </Stack>
        </form>
        <Center marginTop="6">
          <FeedbackAlert status="loading" title="Logging you in, this may take a few seconds..." isOpen={isLoading} />
          <FeedbackAlert
            status="error"
            title={error?.errorKey ?? 'login-error'}
            description={error?.friendlyMessage ?? 'Unable to login at this time, please try again'}
            isOpen={isError}
          />
        </Center>
      </Container>
    </>
  );
};

// const LoginErrorMessage = (props: { error: AxiosError<ILoginResponse> | Error }) => {
//   switch (parseAPIError(props.error) as ILoginResponse['error']) {
//     case 'login-failed':
//     case 'invalid-credentials':
//       return (
//         <StandardAlertMessage
//           status="error"
//           title="Invalid credentials"
//           description="The email or password you entered is incorrect."
//         />
//       );
//     case 'failed-userdata-request':
//     case 'invalid-token':
//       return <StandardAlertMessage status="error" title="Unable to login" description="Please try again later." />;
//     default:
//       return null;
//   }
// };

export default Login;
