import { Button, Container, FormControl, FormLabel, Heading, Input, Stack } from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useFocus } from '@/lib/useFocus';

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useCallback, useState } from 'react';
import { FormMessage } from '@/components/Feedbacks/FormMessage';
import { BRAND_NAME_FULL } from '@/config';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { RecaptchaMessage } from '@/components/RecaptchaMessage/RecaptchaMessage';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IUserForgotPasswordCredentials } from '@/api/user/types';
import { useForgotPassword } from '@/api/user/user';

export { useQuery } from '@tanstack/react-query';

const ForgotPassword: NextPage = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [formError, setFormError] = useState<Error | string | null>(null);
  const { register, handleSubmit } = useForm<IUserForgotPasswordCredentials>({
    defaultValues: { email: '' },
  });
  const { ref, ...registerEmail } = register('email', { required: true });
  const [emailRef] = useFocus();

  const { mutate: submit, data, isError, isLoading, error } = useForgotPassword();

  const onFormSubmit: SubmitHandler<IUserForgotPasswordCredentials> = useCallback(
    async (params) => {
      if (!executeRecaptcha) {
        setFormError('ReCAPTCHA not loaded properly. Please refresh the page and try again.');
        return;
      }

      try {
        params.recaptcha = await executeRecaptcha('forgot_password');
        submit(params);
      } catch (e) {
        setFormError(e as Error);
      }
    },
    [executeRecaptcha, submit],
  );

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME_FULL} Forgot Password`}</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading as="h2" alignSelf="center" my="6" id="form-label">
          Forgot Password
        </Heading>
        <form onSubmit={handleSubmit(onFormSubmit)} aria-labelledby="form-label">
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
        <RecaptchaMessage />
        <FormMessage show={!!formError} title="Unable to submit form" error={formError} />
      </Container>
    </>
  );
};

export default ForgotPassword;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
