import { FormLabel, Spinner, Text } from '@chakra-ui/react';

import { composeNextGSSP } from '@/ssr-utils';
import { GetServerSideProps } from 'next';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { dehydrate, QueryClient, QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';
import { useSettings } from '@/lib/useSettings';
import { isNotEmpty } from 'ramda-adjunct';
import { logger } from '@/logger';
import { biblibSortOptions } from '@/components/Sort/model';
import { SettingsLayout } from '@/components/Layout';
import { Select, SelectOption } from '@/components/Select';
import { ResetSettingsButton } from '@/components/Settings';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IADSApiUserDataParams, UserDataKeys } from '@/api/user/types';
import { BiblibSortField } from '@/api/models';
import { fetchUserSettings, userKeys } from '@/api/user/user';

const librarySettingsKeys = [UserDataKeys.PREFERRED_LIB_SORT];

const Page = () => {
  return (
    <SettingsLayout
      title="Libraries Settings"
      maxW={{ base: 'container.sm', lg: 'container.lg' }}
      headerAction={<ResetSettingsButton settingsKeys={librarySettingsKeys} label="Reset to defaults" />}
    >
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
              <LibsSettingsPage />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </SettingsLayout>
  );
};

const LibsSettingsPage = () => {
  const { settings, updateSettings } = useSettings();

  // params used to update user data
  const [params, setParams] = useState<IADSApiUserDataParams>({});

  useEffect(() => {
    if (isNotEmpty(params)) {
      updateSettings(params);
    }
  }, [params, updateSettings]);

  const preferredSortOption = useMemo(() => {
    return biblibSortOptions.filter((o) => o.id === settings.preferredLibrarySort);
  }, [settings]);

  // apply changes
  const handleApplyPreferredSort = ({ id }: SelectOption<BiblibSortField>) => {
    setParams({ [UserDataKeys.PREFERRED_LIB_SORT]: id });
  };

  const label = (
    <>
      <FormLabel>Default Sort</FormLabel>
      <Text mb={1}>How records in a library are sorted</Text>
    </>
  );
  return (
    <Select<SelectOption<BiblibSortField>>
      label={label}
      hideLabel={false}
      value={preferredSortOption}
      options={biblibSortOptions}
      stylesTheme="default"
      onChange={handleApplyPreferredSort}
      id="preferred-lib-sort"
    />
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
