import { IUserRegistrationCredentials, useRegisterUser } from '@api';
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
} from '@components';
import { NextPage } from 'next';
import Head from 'next/head';
import { Control, useForm, useWatch } from 'react-hook-form';
import { useFocus } from '@lib/useFocus';
import { useEffect } from 'react';
import { useRedirectWithNotification } from '@components/Notification';
import { parseAPIError } from '@utils';
import { Recaptcha } from '@components/Recaptcha/Recaptcha';

const initialParams: IUserRegistrationCredentials = { email: '', password: '', confirmPassword: '', recaptcha: '' };

const Register: NextPage = () => {
  const redirect = useRedirectWithNotification();
  const { mutate: submit, data, isError, isLoading, error } = useRegisterUser();
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: initialParams,
  });
  register('recaptcha');
  const { ref, ...registerProps } = register('email', { required: true });
  const [emailRef] = useFocus();

  useEffect(() => {
    if (data) {
      void redirect('account-register-success', { path: '/user/account/login' });
    }
  }, [data, redirect]);

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Register</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center" my="6" id="form-label" as="h2">
          Register
        </Heading>
        <form onSubmit={void handleSubmit((params) => submit(params))} aria-labelledby="form-label">
          <Recaptcha onChange={(value) => setValue('recaptcha', value)} />
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
      </Container>
    </div>
  );
};

export default Register;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';

const RequirementsController = ({ control }: { control: Control<typeof initialParams> }) => {
  const password = useWatch({ control, name: 'password' });
  return <PasswordRequirements password={password} />;
};
