import { ExportApiFormatKey, ExportApiJournalFormat } from '@api';
import { Button, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react';
import {
  AuthorCutoffSlider,
  FormatSelect,
  JournalFormatSelect,
  KeyFormatInput,
  MaxAuthorsSlider,
  SettingsLayout,
} from '@components';
import { composeNextGSSP, noop, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

const ExportSettingsPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  // TODO: fetch settings
  // TODO: Change handlers

  return (
    <SettingsLayout title="Export Settings">
      <Stack direction="column" spacing={5}>
        <FormatSelect format={ExportApiFormatKey.bibtex} dispatch={noop} label="Default Export Format" />
        <FormControl>
          <FormLabel>Custom Formats</FormLabel>
          <Button size="md">Add</Button>
        </FormControl>
        <FormControl>
          <FormLabel>BibTeX Default Export Key Format</FormLabel>
          <Input placeholder="%1H:%Y:%q" size="md" />
        </FormControl>
        <JournalFormatSelect
          journalformat={[ExportApiJournalFormat.AASTeXMacros]}
          dispatch={noop}
          label="TeX Journal Name Handling"
        />
        <MaxAuthorsSlider maxauthor={[10]} dispatch={noop} label="BibTeX Default Export Max Authors" />
        <AuthorCutoffSlider authorcutoff={[10]} dispatch={noop} label="BibTeX Default Author Cutoff" />
        <KeyFormatInput keyformat={['']} dispatch={noop} label="BibTeX ABS Default Export Key Format" />
        <MaxAuthorsSlider maxauthor={[10]} dispatch={noop} label="BibTeX ABS Default Export Max Authors" />
        <AuthorCutoffSlider authorcutoff={[10]} dispatch={noop} label="BibTeX ABS Default Author Cutoff" />
      </Stack>
    </SettingsLayout>
  );
};

export default ExportSettingsPage;

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
}, userGSSP);
