import { IUserChangePasswordCredentials } from '@api';
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
import { getDefaultReducer } from '@hooks/auth/model';
import { IAuthForm } from '@hooks/auth/types';
import { useChangePassword } from '@hooks/auth/useChangePassword';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { FormEventHandler, useCallback, useReducer, useRef, useState } from 'react';
import { composeNextGSSP } from '@ssrUtils';

const initialState: IAuthForm<IUserChangePasswordCredentials> = {
  params: { currentPassword: '', password: '', confirmPassword: '' },
  status: 'idle',
  error: null,
};
const defaultFormReducer = getDefaultReducer(initialState);

const ChangePassword: NextPage = () => {
  const [state, dispatch] = useReducer(defaultFormReducer, initialState);

  // form state
  const [formError, setFormError] = useState<string>(null);
  const [showPassword, setShowPassword] = useBoolean(false);

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

  useChangePassword(state.params, {
    onError: ({ error }) => dispatch({ type: 'setError', error }),
    enabled: state.status === 'submitting',
  });

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Change Password</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Change Password</Heading>
        <form onSubmit={handleSubmit}>
          <Stack direction="column" spacing={4} my={2}>
            <FormControl isRequired>
              <FormLabel>Current Password</FormLabel>
              <Input
                autoFocus
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="********"
                name="currentpassword"
                id="currentpassword"
                onChange={(e) => dispatch({ type: 'setCurrentPassword', currentPassword: e.currentTarget.value })}
                value={state.params.currentPassword}
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

export default ChangePassword;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  if (!ctx.req.session.isAuthenticated) {
    return Promise.resolve({
      redirect: {
        destination: `/user/account/login?redirectUri=${encodeURIComponent(ctx.req.url)}`,
        permanent: false,
      },
      props: {},
    });
  }

  return Promise.resolve({
    props: {},
  });
});
