import { useEffect, useState } from 'react';
import { useSettings } from '@/lib/useSettings';
import { Button, chakra, Heading, Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { AcademicCapIcon } from '@heroicons/react/20/solid';
import { GetServerSideProps } from 'next';
import { composeNextGSSP } from '@/ssr-utils';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { isNonEmptyArray, isNotNilOrEmpty } from 'ramda-adjunct';
import { find, propEq } from 'ramda';
import { logger } from '@/logger';
import { createOptions, Select, SelectOption } from '@/components/Select';
import { SettingsLayout } from '@/components/Layout';
import { SimpleLink } from '@/components/SimpleLink';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IADSApiLibraryLinkServersResponse, LibraryLinkServer } from '@/api/vault/types';
import { fetchLibraryLinkServers, useLibraryLinkServers, vaultKeys } from '@/api/vault/vault';
import { fetchUserSettings, userKeys } from '@/api/user/user';

const findServer = (url: string, linkServer: IADSApiLibraryLinkServersResponse) =>
  find(propEq('link', url), linkServer);

const createLinkServerOptions = createOptions<LibraryLinkServer>('name', 'link');

const defaultSelection: SelectOption<LibraryLinkServer> = {
  id: {
    name: '',
    link: '',
    gif: '',
  },
  label: 'No Selected Institution',
  value: '',
};

const LibraryLinkServerPage = () => {
  const { settings, updateSettings } = useSettings();
  const { data: servers } = useLibraryLinkServers();
  const [selected, setSelected] = useState<SelectOption<LibraryLinkServer>>(defaultSelection);

  // the incoming link_server is the URL for the server, we need to find it in the list of servers
  useEffect(() => {
    if (isNonEmptyArray(servers) && isNotNilOrEmpty(settings['link_server'])) {
      const server = findServer(settings['link_server'], servers);
      if (server) {
        setSelected({
          id: server,
          label: server.name,
          value: server.link,
        });
      }
    }
  }, [settings['link_server'], servers]);

  const handleSubmit = (option: SelectOption<LibraryLinkServer>) => updateSettings({ link_server: option.value });
  const handleClear = () => {
    setSelected(defaultSelection);
    updateSettings({ link_server: '' });
  };

  return (
    <SettingsLayout title="Library Link Server">
      <VStack spacing={4} align="flex-start">
        <Skeleton isLoaded={isNonEmptyArray(servers)} width="full">
          <Select<SelectOption<LibraryLinkServer>>
            value={selected}
            options={createLinkServerOptions(servers)}
            stylesTheme="default"
            onChange={handleSubmit}
            label="Choose Your Institution"
            id="library-server-selector"
            instanceId="library-server-instance"
            hideLabel={false}
            isSearchable
          />
        </Skeleton>
        <Button variant="link" colorScheme="blue" size="sm" onClick={handleClear}>
          Clear Selection
        </Button>
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
            <SimpleLink href="/scixhelp" display="inline">
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

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async () => {
  const queryClient = new QueryClient();

  try {
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
  } catch (error) {
    logger.error({ msg: 'GSSP error on libraryLink settings page', error });
    return {
      props: {
        pageError: parseAPIError(error),
      },
    };
  }
});
