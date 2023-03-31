import { Expandable, Select, SelectOption, SettingsLayout } from '@components';
import { Text } from '@chakra-ui/react';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { composeNextGSSP } from '@ssrUtils';

const LibraryLinkServerPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const useGetOptions = (options: string[]) =>
    options.map((o) => ({
      id: o,
      label: o,
      value: o,
    }));

  // TODO fetch mirrors
  const servers = ['Harvard University Library'];
  const serverOptions = useGetOptions(servers);
  const serverOption = serverOptions[0];

  const handleSubmit = (option: SelectOption<string>) => {
    console.log(option.id);
  };

  const description = (
    <>
      <Text as="h2" fontWeight="bold">
        What Is a Library Link Server?
      </Text>{' '}
      <Text>
        Users who have access to electronic resources through their library subscriptions can configure their user
        preferences so that the appropriate links to the fulltext will be provided when viewing a record in the ADS.
        After your selection, look for the <strong>My Institution</strong> entry in the source list on an abstract page.
        If you find your institution in the above list, please select it so that we can generate the appropriate links
        for you.
      </Text>
      <Text>For more information, please visit our Help Docs.</Text>
      <Text as="h2" fontWeight="bold">
        Institution Not Found?
      </Text>{' '}
      Please contact your electronic resources librarian and request that they email{' '}
      <a href="mailto: adshelp@cfa.harvard.edu">adshelp@cfa.harvard.edu</a> with the relevant openurl information. If
      you are still having difficulties, Contact Us for help.
    </>
  );

  return (
    <SettingsLayout title="Library Link Server">
      <Expandable title="About Library Link Server" description={description}></Expandable>
      <Select<SelectOption<string>>
        value={serverOption}
        options={serverOptions}
        stylesTheme="default"
        onChange={handleSubmit}
        label="Choose Your Institution"
        id="library-server-selector"
        instanceId="library-server-instance"
        hideLabel={false}
      />
    </SettingsLayout>
  );
};

export default LibraryLinkServerPage;

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
