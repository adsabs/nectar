import { NextPage } from 'next';
import { Button, Container, FormControl, FormErrorMessage, FormLabel, Heading, VStack } from '@chakra-ui/react';
import {
  PasswordRequirements,
  PasswordTextInput,
  passwordValidators,
  SimpleLink,
  StandardAlertMessage,
} from '@/components';
import { useRouter } from 'next/router';
import { useFocus } from '@/lib/useFocus';
import { Control, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { IUserResetPasswordCredentials, useResetPassword } from '@/api';
import { parseAPIError } from '@/utils';
import { useEffect } from 'react';
import { useRedirectWithNotification } from '@/components/Notification';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';

const ResetPasswordPage: NextPage = () => {
  const router = useRouter();
  const redirect = useRedirectWithNotification();
  const [mainInputRef] = useFocus<HTMLInputElement>();

  const { mutate: submit, isLoading, isError, error, data } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    getValues,
  } = useForm<IUserResetPasswordCredentials>({
    defaultValues: { password: '', confirmPassword: '', verifyToken: router.query.verifyToken?.[0] },
  });

  const { ref, ...passwordProps } = register('password', {
    required: true,
    validate: passwordValidators,
    minLength: 4,
  });

  useEffect(() => {
    if (data) {
      void redirect('account-reset-password-success', { path: '/user/account/login' });
    }
  }, [redirect, data]);

  const onFormSubmit: SubmitHandler<IUserResetPasswordCredentials> = (params) => {
    submit(params);
  };

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME_FULL} Verify Password Reset`}</title>
      </Head>
      <Container display="flex" flexDirection="column" py="24">
        <Heading as="h2" id="form-label" alignSelf="center" my="6">
          Reset Password
        </Heading>

        <form onSubmit={handleSubmit(onFormSubmit)} aria-labelledby="form-label">
          <VStack spacing="4">
            <FormControl isInvalid={!!errors.password} isRequired>
              <FormLabel>New Password</FormLabel>
              <PasswordTextInput
                ref={(value) => {
                  ref(value);
                  mainInputRef.current = value;
                }}
                name="password"
                {...passwordProps}
              />
              <PasswordContainer control={control} />
            </FormControl>
            <FormControl isInvalid={!!errors.confirmPassword} isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <PasswordTextInput
                name="confirmPassword"
                {...register('confirmPassword', {
                  required: true,
                  validate: (value) => value === getValues('password'),
                })}
              />
              {!!errors.confirmPassword && <FormErrorMessage>Passwords do not match</FormErrorMessage>}
            </FormControl>
            <input type="hidden" name="token" value={router.query.verifyToken?.[0]} />
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
                title="Password reset successfully"
                description={
                  <>
                    You can now{' '}
                    <SimpleLink display="inline" href="/user/account/login">
                      login
                    </SimpleLink>{' '}
                    with your new password
                  </>
                }
              />
            )}
          </VStack>
        </form>
      </Container>
    </>
  );
};

export default ResetPasswordPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';

const PasswordContainer = ({ control }: { control: Control<IUserResetPasswordCredentials> }) => {
  const password = useWatch({ control, name: 'password' });
  return <PasswordRequirements password={password} />;
};
