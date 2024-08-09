import {
  DatabaseEnum,
  DEFAULT_USER_DATA,
  ExternalLinkAction,
  fetchUserSettings,
  IADSApiUserDataParams,
  SolrSortField,
  UserDataKeys,
  userKeys,
} from '@/api';
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
} from '@/components';
import { composeNextGSSP } from '@/ssr-utils';
import { GetServerSideProps } from 'next';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { dehydrate, QueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';
import { useSettings } from '@/lib/useSettings';
import { isNotEmpty } from 'ramda-adjunct';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils';
import { solrSortOptions } from '@/components/Sort/model';

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
    if (isNotEmpty(params)) {
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
    const preferredSortOption = solrSortOptions.filter((o) => o.id === settings.preferredSearchSort);

    return {
      authorsVisible,
      externalLinksAction,
      databases,
      preferredSortOption,
    };
  }, [settings, externalLinksOptions]);

  // apply changes
  const handleApplyPreferredSort = ({ id }: SelectOption<SolrSortField>) => {
    setParams({ [UserDataKeys.PREFERRED_SEARCH_SORT]: id });
  };

  const handleApplyAuthorsVisible = (n: number) => {
    setParams({ [UserDataKeys.MIN_AUTHOR_RESULT]: n.toString() });
  };

  const handleApplyExternalLinks = ({ id }: SelectOption<ExternalLinkAction>) => {
    setParams({ [UserDataKeys.EXTERNAL_LINK_ACTION]: id });
  };

  const handleApplyDatabases = useCallback(
    (names: string[]) => {
      const currentDatabases = settings[UserDataKeys.DEFAULT_DATABASE];

      // if ALL is selected, reset to default (except for All)
      if (names.includes(DatabaseEnum.All)) {
        return setParams({
          [UserDataKeys.DEFAULT_DATABASE]: [
            ...DEFAULT_USER_DATA[UserDataKeys.DEFAULT_DATABASE].filter((db) => db.name !== DatabaseEnum.All),
            { name: DatabaseEnum.All, value: true },
          ],
        });
      }

      const defaultDatabases: typeof settings[UserDataKeys.DEFAULT_DATABASE] = [];
      for (const db of currentDatabases) {
        // skip ALL
        if (db.name === DatabaseEnum.All) {
          continue;
        }
        defaultDatabases.push({
          name: db.name,
          value: names.includes(db.name),
        });
      }
      setParams({ [UserDataKeys.DEFAULT_DATABASE]: defaultDatabases });
    },
    [settings[UserDataKeys.DEFAULT_DATABASE]],
  );

  return (
    <>
      <Stack direction="column" spacing={5}>
        <Select<SelectOption<SolrSortField>>
          label="Default Sort"
          hideLabel={false}
          value={selectedValues.preferredSortOption}
          options={solrSortOptions}
          stylesTheme="default"
          id="preferred-search-sort"
          onChange={handleApplyPreferredSort}
        />
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
                <Stack direction="row" id="default-collections" spacing="6">
                  <Checkbox value="All">All</Checkbox>
                  <Checkbox value="Physics" isDisabled={selectedValues.databases.selected.includes(DatabaseEnum.All)}>
                    Physics
                  </Checkbox>
                  <Checkbox value="Astronomy" isDisabled={selectedValues.databases.selected.includes(DatabaseEnum.All)}>
                    Astronomy
                  </Checkbox>
                  <Checkbox value="General" isDisabled={selectedValues.databases.selected.includes(DatabaseEnum.All)}>
                    General
                  </Checkbox>
                  <Checkbox
                    value="Earth Science"
                    isDisabled={selectedValues.databases.selected.includes(DatabaseEnum.All)}
                  >
                    Earth Science
                  </Checkbox>
                </Stack>
              </CheckboxGroup>
            </FormControl>
          )}
        </DescriptionCollapse>
      </Stack>
    </>
  );
};

export default Page;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async () => {
  const queryClient = new QueryClient();

  try {
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
    logger.error({ msg: 'GSSP error in application settings page', error });
    return {
      props: {
        pageError: parseAPIError(error),
      },
    };
  }
});
