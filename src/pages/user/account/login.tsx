import { IUserCredentials } from '@api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  useBoolean,
} from '@chakra-ui/react';
import { SimpleLink } from '@components';
import { useSession } from '@hooks/auth';
import { getDefaultReducer } from '@hooks/auth/model';
import { IAuthForm } from '@hooks/auth/types';
import { useLogin } from '@hooks/auth/useLogin';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEventHandler, useReducer } from 'react';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

const initialState: IAuthForm<IUserCredentials> = {
  error: null,
  params: { email: '', password: '' },
  status: 'idle',
};

const defaultFormReducer = getDefaultReducer(initialState);

const Login: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const [showPassword, setShowPassword] = useBoolean(false);

  const [state, dispatch] = useReducer(defaultFormReducer, initialState);
  useLogin(state.params, {
    enabled: state.status === 'submitting',
    onError: ({ error }) => dispatch({ type: 'setError', error }),
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    dispatch({ type: 'submit' });
  };

  // if already authenticated, redirect immediately
  if (isAuthenticated) {
    void router.push('/', null, { shallow: false });
    return null;
  }

  return (
    <>
      <Head>
        <title>NASA Science Explorer - Login</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Welcome!</Heading>
        <form onSubmit={handleSubmit}>
          <Stack direction="column" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="text"
                placeholder="email@example.com"
                name="email"
                id="email"
                onChange={(e) => dispatch({ type: 'setEmail', email: e.currentTarget.value })}
                value={state.params.email}
                required
                autoFocus
              />
              <FormErrorMessage>Error message</FormErrorMessage>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  placeholder="********"
                  name="password"
                  id="password"
                  onChange={(e) => dispatch({ type: 'setPassword', password: e.currentTarget.value })}
                  value={state.params.password}
                  pr="4.5rem"
                  type={showPassword ? 'text' : 'password'}
                  required
                />
                <InputRightElement>
                  <Button h="6" size="sm" mr="2" onClick={setShowPassword.toggle} variant="ghost">
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>Error message</FormErrorMessage>
            </FormControl>
            <SimpleLink href="/user/account/forgotpassword">Forgot password?</SimpleLink>
            <Button type="submit" isLoading={state.status === 'submitting'}>
              Submit
            </Button>
            <SimpleLink alignSelf="center" href="/user/account/register">
              Register
            </SimpleLink>
            {state.status === 'error' && (
              <Alert status="error">
                <AlertTitle>Unable to complete request</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </Container>
    </>
  );
};

export default Login;
