import { IUserForgotPasswordCredentials, useForgotPassword } from '@api';
import { Button, Container, FormControl, FormLabel, Heading, Input, Stack } from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { useFocus } from '@lib/useFocus';
import { Recaptcha } from '@components/Recaptcha/Recaptcha';
import { parseAPIError } from '@utils';
import { StandardAlertMessage } from '@components';

export { useQuery } from '@tanstack/react-query';

const ForgotPassword: NextPage = () => {
  const { register, handleSubmit, setValue } = useForm<IUserForgotPasswordCredentials>({
    defaultValues: { email: '' },
  });
  register('recaptcha');
  const { ref, ...registerEmail } = register('email', { required: true });
  const [emailRef] = useFocus();

  const { mutate: submit, data, isError, isLoading, error } = useForgotPassword();

  return (
    <>
      <Head>
        <title>NASA Science Explorer - Forgot Password</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading as="h2" alignSelf="center" my="6" id="form-label">
          Forgot Password
        </Heading>
        <form onSubmit={void handleSubmit((params) => submit(params))} aria-labelledby="form-label">
          <Recaptcha onChange={(value) => setValue('recaptcha', value)} />
          <Stack direction="column" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="text"
                placeholder="email@example.com"
                name="email"
                id="email"
                ref={(value) => {
                  ref(value);
                  emailRef.current = value;
                }}
                {...registerEmail}
              />
            </FormControl>
            <Button type="submit" isLoading={isLoading}>
              Submit
            </Button>
            {isError && (
              <StandardAlertMessage
                status="error"
                title="There was an issue resetting your password"
                description={parseAPIError(error)}
              />
            )}
            {!!data && (
              <StandardAlertMessage
                status="success"
                title="Check your email"
                description="We've sent you an email with a link to reset your password."
              />
            )}
          </Stack>
        </form>
      </Container>
    </>
  );
};

export default ForgotPassword;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
