import { IUserRegistrationCredentials } from '@api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  ListItem,
  Stack,
  UnorderedList,
  useBoolean,
} from '@chakra-ui/react';
import { SimpleLink } from '@components';
import { useSession } from '@hooks/auth';
import { getDefaultReducer } from '@hooks/auth/model';
import { IAuthForm } from '@hooks/auth/types';
import { useRegister } from '@hooks/auth/useRegister';
import { useRecaptcha } from '@hooks/useRecaptcha';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEventHandler, useCallback, useReducer, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

const initialState: IAuthForm<IUserRegistrationCredentials> = {
  params: { email: '', password: '', confirmPassword: '', recaptcha: null },
  status: 'idle',
  error: null,
};
const defaultFormReducer = getDefaultReducer(initialState);

const Register: NextPage = () => {
  const router = useRouter();
  const [state, dispatch] = useReducer(defaultFormReducer, initialState);

  // form state
  const [formError, setFormError] = useState<string>(null);
  const [showPassword, setShowPassword] = useBoolean(false);

  // registration handling
  const { isAuthenticated } = useSession();

  // refs
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const isFormInvalid = useCallback(() => {
    setFormError(null);
    if (state.params.password !== state.params.confirmPassword) {
      setFormError('Passwords do not match');
      confirmPasswordRef.current.select();
      confirmPasswordRef.current.focus();
      return true;
    } else if (state.params.password.length < 4) {
      setFormError('Passwords must be at least 4 characters long');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    } else if (/^[^A-Z]+$/.exec(state.params.password) !== null) {
      setFormError('Passwords must contain at least 1 uppercase letter');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    } else if (/^[^a-z]+$/.exec(state.params.password) !== null) {
      setFormError('Passwords must contain at least 1 lowercase letter');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    } else if (/^[^0-9]+$/.exec(state.params.password) !== null) {
      setFormError('Passwords must contain at least 1 digit');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    }
  }, [state.params.password, state.params.confirmPassword, passwordRef, confirmPasswordRef]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // check form for errors, this will alert user
    if (isFormInvalid()) {
      return;
    }

    dispatch({ type: 'submit' });
  };

  const { getRecaptchaProps } = useRecaptcha({
    onExecute: (recaptcha) => dispatch({ type: 'setRecaptcha', recaptcha }),
    onError: (error) => dispatch({ type: 'setError', error }),
  });

  useRegister(state.params, {
    onError: ({ error }) => dispatch({ type: 'setError', error }),
    enabled: state.status === 'submitting',
  });

  // if already authenticated, redirect immediately
  if (isAuthenticated) {
    void router.push('/', null, { shallow: false });
    return null;
  }

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Register</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Register Account</Heading>
        <form onSubmit={handleSubmit}>
          <ReCAPTCHA {...getRecaptchaProps()} />
          <Stack direction="column" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                autoFocus
                type="email"
                required
                placeholder="email@example.com"
                name="email"
                id="email"
                onChange={(e) => dispatch({ type: 'setEmail', email: e.currentTarget.value })}
                value={state.params.email}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                required
                name="password"
                id="password"
                onChange={(e) => dispatch({ type: 'setPassword', password: e.currentTarget.value })}
                value={state.params.password}
                ref={passwordRef}
              />
              <FormHelperText>
                <Heading size="xs" id="password-reqs">
                  Password requirements:
                </Heading>
                <UnorderedList aria-labelledby="password-reqs">
                  <ListItem>1 lowercase letter</ListItem>
                  <ListItem>1 uppercase letter</ListItem>
                  <ListItem>1 numerical digit</ListItem>
                  <ListItem>At least 4 characters long</ListItem>
                </UnorderedList>
              </FormHelperText>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                required
                name="confirmpassword"
                id="confirmpassword"
                onChange={(e) => dispatch({ type: 'setPasswordConfirm', confirmPassword: e.currentTarget.value })}
                value={state.params.confirmPassword}
                ref={confirmPasswordRef}
              />
              <Button type="button" variant="link" onClick={setShowPassword.toggle}>
                {showPassword ? 'Hide password' : 'Show password'}
              </Button>
            </FormControl>
            <Button type="submit" isLoading={state.status === 'submitting'}>
              Submit
            </Button>
            <SimpleLink alignSelf="center" href="/user/account/login">
              Login
            </SimpleLink>
            {state.status === 'error' && (
              <Alert status="error">
                <AlertTitle>Unable to complete request</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            {formError && (
              <Alert status="error">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </Container>
    </div>
  );
};

export default Register;
