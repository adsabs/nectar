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
  Stack,
} from '@chakra-ui/react';
import { SimpleLink } from '@components';
import { useSession } from '@hooks/useSession';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEvent, useCallback, useState } from 'react';

const Login: NextPage = () => {
  const router = useRouter();
  const { login, isAuthenticated } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const result = await login({ email, password });
      if (result.error) {
        setError(result.error);
      }
    },
    [login, email, password],
  );

  // if already authenticated, redirect immediately
  if (isAuthenticated) {
    void router.push('/', null, { shallow: false });
    return null;
  }

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Login</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Welcome!</Heading>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <Stack direction="column" spacing={4}>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                type="text"
                placeholder="email@example.com"
                name="email"
                id="email"
                onChange={(e) => setEmail(e.currentTarget.value)}
                value={email}
                autoFocus
              />
              <FormErrorMessage>Error message</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                placeholder="********"
                name="password"
                id="password"
                onChange={(e) => setPassword(e.currentTarget.value)}
                value={password}
              />
              <FormErrorMessage>Error message</FormErrorMessage>
            </FormControl>
            <Button type="submit">Login with email</Button>
            <SimpleLink alignSelf="center" href="/user/account/register">
              Register
            </SimpleLink>
            {error && (
              <Alert status="error">
                <AlertTitle>Unable to login user</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </Container>
    </div>
  );
};

export default Login;
