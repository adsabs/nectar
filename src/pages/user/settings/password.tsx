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
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { FormEvent, useState } from 'react';

const ChangePasswordPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [password, setPassword] = useState('');
  const [, setNewPassword] = useState('');
  const [error, setError] = useState<string>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
  };
  return (
    <SettingsLayout title="Change Password">
      <form onSubmit={handleSubmit}>
        <Stack direction="column" spacing={5}>
          <FormControl>
            <FormLabel>Current Password</FormLabel>
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
          <FormControl>
            <FormLabel>New Password</FormLabel>
            <Text fontSize="sm">
              Passwords should be at least five characters and include at least one number and one letter.
            </Text>
            <Input
              type="password"
              placeholder="********"
              name="password"
              id="password"
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              value={password}
              size="md"
            />
            <FormErrorMessage>Error message</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Retype New Password</FormLabel>
            <Input
              type="password"
              placeholder="********"
              name="password"
              id="password"
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              value={password}
              size="md"
            />
            <FormErrorMessage>Error message</FormErrorMessage>
          </FormControl>
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

export default ChangePasswordPage;

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
