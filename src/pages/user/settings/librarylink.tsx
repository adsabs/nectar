import { Select, SelectOption, SettingsLayout, SimpleLink } from '@components';
import { fetchLibraryLinkServers, fetchUserSettings, useLibraryLinkServers, userKeys, vaultKeys } from '@api';
import { useMemo } from 'react';
import { useSettings } from '@lib/useSettings';
import { chakra, Heading, Icon, Text, VStack } from '@chakra-ui/react';
import { AcademicCapIcon } from '@heroicons/react/20/solid';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { composeNextGSSP } from '@ssr-utils';
import { dehydrate, QueryClient } from '@tanstack/react-query';

const LibraryLinkServerPage = () => {
  const { settings, updateSettings } = useSettings();
  const { data: servers } = useLibraryLinkServers();
  const serverOptions = useMemo(() => {
    if (!servers) {
      return [];
    }
    return servers.map((server) => ({
      id: server.name,
      label: server.name,
      value: server.name,
    }));
  }, [servers]);

  const value = useMemo(() => {
    if (!settings['link_server']) {
      return null;
    }
    return {
      id: settings['link_server'],
      label: settings['link_server'],
      value: settings['link_server'],
    };
  }, [settings['link_server']]);

  const handleSubmit = (option: SelectOption<string>) => {
    updateSettings({ link_server: option.value });
  };

  return (
    <SettingsLayout title="Library Link Server">
      <VStack spacing={4} align="flex-start">
        <Select<SelectOption<string>>
          value={value}
          options={serverOptions}
          stylesTheme="default"
          onChange={handleSubmit}
          label="Choose Your Institution"
          id="library-server-selector"
          instanceId="library-server-instance"
          hideLabel={false}
          isSearchable
        />
        <VStack spacing="2" align="flex-start">
          <Heading as="h3" size="md">
            What Is a Library Link Server?
          </Heading>
          <Text>
            Users who have access to electronic resources through their library subscriptions can configure their user
            preferences so that the appropriate links to the fulltext will be provided when viewing a record in the ADS.
            After your selection, look for the <MyInstitution /> entry in the source list on an abstract page. If you
            find your institution in the above list, please select it so that we can generate the appropriate links for
            you.
          </Text>
          <Text>
            For more information, please visit our{' '}
            <SimpleLink href="/help" display="inline">
              help docs
            </SimpleLink>
            .
          </Text>
          <Heading as="h3" size="sm">
            Institution Not Found?
          </Heading>
          <Text>
            Please contact your electronic resources librarian and request that they email{' '}
            <a href="mailto: adshelp@cfa.harvard.edu">adshelp@cfa.harvard.edu</a> with the relevant openurl information.
            If you are still having difficulties, Contact Us for help.
          </Text>
        </VStack>
      </VStack>
    </SettingsLayout>
  );
};

const MyInstitution = () => {
  return (
    <chakra.span p="1" border="solid 1px black" borderRadius="md">
      <Icon as={AcademicCapIcon} /> My Institution
    </chakra.span>
  );
};

export default LibraryLinkServerPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx: GetServerSidePropsContext) => {
  const queryClient = new QueryClient();

  // prefetch link servers
  await queryClient.prefetchQuery({
    queryKey: vaultKeys.libraryLinkServers(),
    queryFn: fetchLibraryLinkServers,
  });

  // prefetch the user settings
  await queryClient.prefetchQuery({
    queryKey: userKeys.getUserSettings(),
    queryFn: fetchUserSettings,
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
});
