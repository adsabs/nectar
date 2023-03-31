import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { SettingsLayout } from '@components';
import { composeNextGSSP } from '@ssrUtils';
import { useStore } from '@store';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { FormEvent, useState } from 'react';

const UpdateEmailPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  // TODO
  const user = useStore((state) => state.user.username);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
  };

  return (
    <SettingsLayout title="Update Email">
      <form onSubmit={handleSubmit}>
        <Stack direction="column" spacing={5}>
          <Text>
            Current Email: <strong>{user}</strong>
          </Text>
          <FormControl>
            <FormLabel>New Email Address</FormLabel>
            <Input
              type="text"
              placeholder="email@example.com"
              name="email"
              id="email"
              onChange={(e) => setEmail(e.currentTarget.value)}
              value={email}
              autoFocus
              size="md"
            />
            <FormErrorMessage>Error message</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Confirm New Email Address</FormLabel>
            <Input
              type="text"
              placeholder="email@example.com"
              name="email"
              id="email"
              onChange={(e) => setEmail(e.currentTarget.value)}
              value={email}
              size="md"
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
              size="md"
            />
            <FormErrorMessage>Error message</FormErrorMessage>
          </FormControl>
          <Text>You will be logged out of your account until you click the link from the verification email.</Text>
          <Button type="submit" size="md" w={20}>
            Update
          </Button>
          {error && (
            <Alert status="error">
              <AlertTitle>Unable to update</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Stack>
      </form>
    </SettingsLayout>
  );
};

export default UpdateEmailPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx: GetServerSidePropsContext) => {
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
