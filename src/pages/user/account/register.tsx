import { IUserRegistrationCredentials, useRegisterUser } from '@/api';
import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  PasswordRequirements,
  PasswordTextInput,
  passwordValidators,
  SimpleLink,
  StandardAlertMessage,
} from '@/components';
import { NextPage } from 'next';
import Head from 'next/head';
import { Control, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useFocus } from '@/lib/useFocus';
import { useCallback, useEffect, useState } from 'react';
import { useRedirectWithNotification } from '@/components/Notification';
import { parseAPIError } from '@/utils';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { RecaptchaMessage } from '@/components/RecaptchaMessage/RecaptchaMessage';
import { FormMessage } from '@/components/Feedbacks/FormMessage';
import { BRAND_NAME_FULL } from '@/config';

const initialParams: IUserRegistrationCredentials = { email: '', password: '', confirmPassword: '', recaptcha: '' };

const Register: NextPage = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const redirect = useRedirectWithNotification();
  const { mutate: submit, data, isError, isLoading, error } = useRegisterUser();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: initialParams,
  });
  const { ref, ...registerProps } = register('email', { required: true });
  const [emailRef] = useFocus();
  const [formError, setFormError] = useState<Error | string | null>(null);
  useEffect(() => {
    if (data) {
      void redirect('account-register-success', { path: '/user/account/login' });
    }
  }, [data, redirect]);

  const onFormSubmit: SubmitHandler<IUserRegistrationCredentials> = useCallback(
    async (params) => {
      if (!executeRecaptcha) {
        setFormError('ReCAPTCHA not loaded properly. Please refresh the page and try again.');
        return;
      }

      try {
        submit({
          ...params,
          recaptcha: await executeRecaptcha('register'),
        });
      } catch (e) {
        setFormError(e as Error);
      }
    },
    [executeRecaptcha],
  );

  return (
    <div>
      <Head>
        <title>{`${BRAND_NAME_FULL} Register Account`}</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center" my="6" id="form-label" as="h2">
          Register
        </Heading>
        <form onSubmit={handleSubmit(onFormSubmit)} aria-labelledby="form-label">
          <Stack direction="column" spacing={4}>
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                autoFocus
                type="email"
                placeholder="email@example.com"
                name="email"
                id="email"
                autoComplete="email"
                ref={(value) => {
                  emailRef.current = value;
                  ref(value);
                }}
                {...registerProps}
              />
              {!!errors.email && <FormErrorMessage>{errors.email.message}</FormErrorMessage>}
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <PasswordTextInput
                name="password"
                id="password"
                {...register('password', {
                  required: true,
                  minLength: 4,
                  validate: passwordValidators,
                })}
              />
              <RequirementsController control={control} />
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirm password</FormLabel>
              <PasswordTextInput
                name="confirmPassword"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: true,
                  validate: (value) => value === getValues('password'),
                })}
              />
              {!!errors.confirmPassword && <FormErrorMessage>Passwords do not match</FormErrorMessage>}
            </FormControl>
            <Button type="submit" isLoading={isLoading}>
              Submit
            </Button>
            <Text alignSelf="center">
              Already have an account?{' '}
              <SimpleLink href="/user/account/login" display="inline">
                Login
              </SimpleLink>
            </Text>
          </Stack>
        </form>
        {isError && (
          <StandardAlertMessage
            status="error"
            title="Unable to register, please try again"
            description={parseAPIError(error)}
          />
        )}
        <RecaptchaMessage />
        <FormMessage show={!!formError} title="Unable to submit form" error={formError} />
      </Container>
    </div>
  );
};

export default Register;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';

const RequirementsController = ({ control }: { control: Control<typeof initialParams> }) => {
  const password = useWatch({ control, name: 'password' });
  return <PasswordRequirements password={password} />;
};
