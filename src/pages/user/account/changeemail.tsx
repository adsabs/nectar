import { IUserChangeEmailCredentials } from '@api';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useBoolean,
} from '@chakra-ui/react';
import { getDefaultReducer } from '@hooks/auth/model';
import { IAuthForm } from '@hooks/auth/types';
import { useChangeEmail } from '@hooks/auth/useChangeEmail';
import { composeNextGSSP } from '@ssrUtils';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { FormEventHandler, useReducer } from 'react';

const initialState: IAuthForm<IUserChangeEmailCredentials> = {
  params: { email: '', password: '' },
  status: 'idle',
  error: null,
};
const defaultFormReducer = getDefaultReducer(initialState);

const ChangeEmail: NextPage = () => {
  const [state, dispatch] = useReducer(defaultFormReducer, initialState);
  const [showPassword, setShowPassword] = useBoolean(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    dispatch({ type: 'submit' });
  };

  useChangeEmail(state.params, {
    onError: ({ error }) => dispatch({ type: 'setError', error }),
    enabled: state.status === 'submitting',
  });

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Change Email</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Change Email</Heading>
        <form onSubmit={handleSubmit}>
          <Stack direction="column" spacing={4} my={2}>
            <FormControl isRequired>
              <FormLabel>New Email</FormLabel>
              <Input
                type="text"
                placeholder="email@example.com"
                required
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
              />
            </FormControl>

            <Button type="button" alignSelf="flex-start" variant="link" onClick={setShowPassword.toggle}>
              {showPassword ? 'Hide password' : 'Show password'}
            </Button>
            <Button type="submit" isLoading={state.status === 'submitting'}>
              Submit
            </Button>
            {state.status === 'error' && (
              <Alert status="error">
                <AlertTitle>Unable to complete request</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </Container>
    </div>
  );
};

export default ChangeEmail;

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
