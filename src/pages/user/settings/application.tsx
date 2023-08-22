import {
  ExternalLinkAction,
  fetchUserSettings,
  IADSApiUserDataParams,
  IADSApiUserDataResponse,
  UserDataKeys,
  userKeys,
} from '@api';
import { Box, Checkbox, CheckboxGroup, FormControl, FormLabel, Spinner, Stack } from '@chakra-ui/react';
import {
  authorsPerResultsDescription,
  defaultActionExternalLinksDescription,
  defaultCollectionsDescription,
  DescriptionCollapse,
  NumberSlider,
  Select,
  SelectOption,
  SettingsLayout,
} from '@components';
import { composeNextGSSP } from '@ssr-utils';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { dehydrate, QueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { getFallBackAlert } from '@components/Feedbacks/SuspendedAlert';
import { useSettings } from '@lib/useSettings';

// generate options for select component
const useGetOptions = () => {
  return {
    externalLinksOptions: Object.values(ExternalLinkAction).map((v) => ({
      id: v,
      label: v,
      value: v,
    })),
  };
};

const Page = () => {
  return (
    <SettingsLayout title="Search Settings" maxW={{ base: 'container.sm', lg: 'container.lg' }}>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={getFallBackAlert({
              status: 'error',
              label: 'Unable to load user settings',
            })}
          >
            <Suspense fallback={<Spinner />}>
              <AppSettingsPage />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </SettingsLayout>
  );
};

const AppSettingsPage = () => {
  const { settings, updateSettings } = useSettings();

  // options for the select dropdown
  const { externalLinksOptions } = useGetOptions();

  // params used to update user data
  const [params, setParams] = useState<IADSApiUserDataParams>({});

  useEffect(() => {
    if (params) {
      updateSettings(params);
    }
  }, [params, updateSettings]);

  const selectedValues = useMemo(() => {
    const authorsVisible = parseInt(settings.minAuthorsPerResult);
    const externalLinksAction = externalLinksOptions.find((option) => option.id === settings.externalLinkAction);
    const databases = {
      databases: settings.defaultDatabase ?? [],
      selected: settings.defaultDatabase?.filter((d) => d.value === true).map((d) => d.name) ?? [],
    };

    return {
      authorsVisible,
      externalLinksAction,
      databases,
    };
  }, [settings, externalLinksOptions]);

  // apply changes
  const handleApplyAuthorsVisible = (n: number) => {
    setParams({ [UserDataKeys.MIN_AUTHOR_RESULT]: n.toString() });
  };

  const handleApplyExternalLinks = ({ id }: SelectOption<ExternalLinkAction>) => {
    setParams({ [UserDataKeys.EXTERNAL_LINK_ACTION]: id });
  };

  const handleApplyDatabases = (names: string[]) => {
    const newValue = JSON.parse(
      JSON.stringify(settings.defaultDatabase),
    ) as IADSApiUserDataResponse[UserDataKeys.DEFAULT_DATABASE];
    newValue.forEach((v) => {
      if (names.findIndex((n) => n === v.name) === -1) {
        v.value = false;
      } else {
        v.value = true;
      }
    });

    setParams({ [UserDataKeys.DEFAULT_DATABASE]: newValue });
  };

  return (
    <SettingsLayout title="Search Settings">
      <Stack direction="column" spacing={5}>
        <NumberSlider
          min={1}
          max={10}
          value={selectedValues.authorsVisible}
          description={authorsPerResultsDescription}
          label="Authors Visible per Result"
          onChange={handleApplyAuthorsVisible}
        />
        <DescriptionCollapse body={defaultActionExternalLinksDescription} label="Default Action for External Links">
          {({ btn, content }) => (
            <FormControl>
              <Select<SelectOption<ExternalLinkAction>>
                value={selectedValues.externalLinksAction}
                options={externalLinksOptions}
                stylesTheme="default"
                onChange={handleApplyExternalLinks}
                label={
                  <Box mb="2">
                    <FormLabel htmlFor="external-link-action-selector" fontSize={['sm', 'md']}>
                      {'Default Action for External Links'} {btn}
                    </FormLabel>
                    {content}
                  </Box>
                }
                id="external-link-action-selector"
                instanceId="external-link-action-selector-instance"
                hideLabel={false}
              />
            </FormControl>
          )}
        </DescriptionCollapse>
        <DescriptionCollapse body={defaultCollectionsDescription} label="Default collections">
          {({ btn, content }) => (
            <FormControl>
              <Box mb="2">
                <FormLabel htmlFor="default-collections" fontSize={['sm', 'md']}>
                  {'Default Collection(s)'} {btn}
                </FormLabel>
                {content}
              </Box>
              <CheckboxGroup onChange={handleApplyDatabases} value={selectedValues.databases.selected}>
                <Stack direction="row" id="default-collections">
                  {selectedValues.databases.databases.map((o) => (
                    <Checkbox value={o.name} key={o.name}>
                      {o.name}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </FormControl>
          )}
        </DescriptionCollapse>
      </Stack>
    </SettingsLayout>
  );
};

export default AppSettingsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx: GetServerSidePropsContext) => {
  const queryClient = new QueryClient();
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
