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
} from '@chakra-ui/react';
import { Select, SelectOption, SettingsLayout } from '@components';
import { composeNextGSSP } from '@ssrUtils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { FormEvent, useState } from 'react';

const useGetOptions = (mirrors: string[]) =>
  mirrors.map((v) => ({
    id: v,
    label: v,
    value: v,
  }));

const ImportLibraryPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  // TODO fetch mirrors
  const mirrors = ['adsabs.harvard.edu'];
  const mirrorOptions = useGetOptions(mirrors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mirrorOption, setMirrorOption] = useState<SelectOption<string>>(mirrorOptions[0]);
  const [error, setError] = useState<string>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
  };

  return (
    <SettingsLayout title="Import Library from ADS Classic">
      <form onSubmit={handleSubmit}>
        <Stack direction="column" spacing={5}>
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
          <Select<SelectOption<string>>
            value={mirrorOption}
            options={mirrorOptions}
            stylesTheme="default"
            onChange={setMirrorOption}
            label="Choose an ADS Classic Mirror Site"
            id="ads-classic-mirror-selector"
            instanceId="ads-classic-mirror-instance"
            hideLabel={false}
          />
          <Button type="submit" size="md" w={20}>
            Import
          </Button>
          {error && (
            <Alert status="error">
              <AlertTitle>Unable to import</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Stack>
      </form>
    </SettingsLayout>
  );
};

export default ImportLibraryPage;

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
