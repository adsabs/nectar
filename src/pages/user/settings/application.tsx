import {
  DEFAULT_USER_DATA,
  ExternalLinkActionOptions,
  IADSApiUserDataParams,
  IADSApiUserDataResponse,
  UserDataKeys,
} from '@api';
import { getVaultData } from '@auth-utils';
import { Box, Checkbox, CheckboxGroup, FormControl, FormLabel, Stack, useToast } from '@chakra-ui/react';
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
import { useSettings } from '@hooks/useSettings';
import { createStore } from '@store';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useEffect, useMemo, useState } from 'react';

// generate options for select component
const useGetOptions = () => {
  return {
    externalLinksOptions: ExternalLinkActionOptions.map((v) => ({
      id: v,
      label: v,
      value: v,
    })),
  };
};

const AppSettingsPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const toast = useToast({ duration: 3000 });

  // options for the select dropdown
  const { externalLinksOptions } = useGetOptions();

  // params used to update user data
  const [params, setParams] = useState<IADSApiUserDataParams>({});

  const { settings: userData } = useSettings({
    params,
    onSuccess: () => {
      toast({ title: 'updated!' });
    },
    onError: (error) => toast({ status: 'error', description: error }),
  });

  // get user data from store
  // const userData = useStore((state) => state.settings.user);
  // const setSettings = useStore((state) => state.setUserSettings);

  // set user data and get back updated user data
  // const { refetch } = useSetUserData(params, {
  //   enabled: false,
  //   onSuccess: (res) => {
  //     setSettings(res); // remembering to update store
  //     toast({
  //       title: 'Updated',
  //       status: 'success',
  //       duration: 3000,
  //     });
  //   },
  //   onError: (error) => {
  //     const message = axios.isAxiosError(error) ? error.message : error.message ?? 'Unknown error occurred';
  //
  //     toast({
  //       title: 'Error',
  //       status: 'error',
  //       duration: 3000,
  //       description: message,
  //     });
  //   },
  // });

  // prevent an unnecessary set param initally when slider is updated to the fetched value
  useEffect(() => setParams({}), []);

  // apply set user data when params updated
  // useEffect(() => {
  //   if (params && Object.keys(params).length > 0) {
  //     void refetch();
  //   }
  // }, [params]);

  const selectedValues = useMemo(() => {
    const data = userData ?? DEFAULT_USER_DATA;
    const authorsVisible = parseInt(data.minAuthorsPerResult);
    const externalLinksAction = externalLinksOptions.find((option) => option.id === data.externalLinkAction);
    const databases = {
      databases: data.defaultDatabase ?? [],
      selected: data.defaultDatabase?.filter((d) => d.value === true).map((d) => d.name) ?? [],
    };

    return {
      authorsVisible,
      externalLinksAction,
      databases,
    };
  }, [userData, externalLinksOptions]);

  // apply changes
  const handleApplyAuthorsVisible = (n: number) => {
    setParams({ [UserDataKeys.MIN_AUTHOR_RESULT]: n.toString() });
  };

  const handleApplyExternalLinks = ({ id }: SelectOption<string>) => {
    setParams({ [UserDataKeys.EXTERNAL_LINK_ACTION]: id });
  };

  const handleApplyDatabases = (names: string[]) => {
    const newValue = JSON.parse(
      JSON.stringify(userData.defaultDatabase),
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
              <Select<SelectOption<string>>
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
  if (!ctx.req.session.isAuthenticated) {
    return Promise.resolve({
      redirect: {
        destination: `/user/account/login?redirectUri=${encodeURIComponent(ctx.req.url)}`,
        permanent: false,
      },
      props: {},
    });
  }

  const userData = await getVaultData(ctx);
  const initialState = createStore().getState();

  return {
    props: {
      userData,
      dehydratedAppState: {
        settings: {
          ...initialState.settings,
          user: userData,
        },
      },
    },
  };
}, userGSSP);
