import {
  IADSApiUserDataParams,
  UserDataKeys,
  useSetUserData,
  ExternalLinkActionOptions,
  IADSApiUserDataResponse,
  MinAuthorsPerResultOptions,
  DEFAULT_USER_DATA,
} from '@api';
import { Box, Checkbox, CheckboxGroup, FormControl, FormLabel, Stack, useToast } from '@chakra-ui/react';
import { DescriptionCollapse, Select, SelectOption, SettingsLayout } from '@components';
import { useStore } from '@store';
import { composeNextGSSP, userGSSP } from '@utils';
import axios from 'axios';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useEffect, useMemo, useState } from 'react';

// generate options for select component
const useGetOptions = () => {
  return {
    authorsVisibleOptions: MinAuthorsPerResultOptions.map((v) => ({
      id: v,
      label: v,
      value: v,
    })),
    externalLinksOptions: ExternalLinkActionOptions.map((v) => ({
      id: v,
      label: v,
      value: v,
    })),
  };
};

const authorsPerResultsDescription = (
  <>
    Specifies the number of authors to show under each result before the list is truncated. (<strong>default: 4</strong>
    )
  </>
);

const defaultActionExternalLinksDescription = (
  <>
    Select the default action when opening an external link. (<strong>default: Auto</strong>)
  </>
);

const defaultCollectionsDescription = (
  <>
    This will apply a default collection facet to each search. You can manually remove or alter it from there. (
    <strong>default: none</strong>)
  </>
);

const AppSettingsPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const toast = useToast();

  // options for the select dropdown
  const { authorsVisibleOptions, externalLinksOptions } = useGetOptions();

  // params used to update user data
  const [params, setParams] = useState<IADSApiUserDataParams>(null);

  // get user data from store
  const userData = useStore((state) => state.settings.user);

  // set user data and get back updated user data
  const { data: updatedData, refetch } = useSetUserData(params, {
    enabled: false,
    onSuccess: () => {
      toast({
        title: 'Updated',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      const message = axios.isAxiosError(error) ? error.message : error.message ?? 'Unknown error occurred';

      toast({
        title: 'Error',
        status: 'error',
        duration: 3000,
        description: message,
      });
    },
  });

  // apply set user data when params updated
  useEffect(() => {
    if (params) {
      void refetch();
    }
  }, [params]);

  // selected option
  const authorsVisibleValue = useMemo(() => {
    const value = userData?.minAuthorsPerResult ?? DEFAULT_USER_DATA.minAuthorsPerResult;
    return authorsVisibleOptions.find((option) => option.id === value);
  }, [userData]);

  // selected option
  const externalLinksValue = useMemo(() => {
    const value = userData?.externalLinkAction ?? DEFAULT_USER_DATA.externalLinkAction;
    return externalLinksOptions.find((option) => option.id === value);
  }, [userData]);

  // selected databases
  const databasesValue = useMemo(() => {
    const databases = userData?.defaultDatabase ?? DEFAULT_USER_DATA.defaultDatabase;
    const selected = databases.filter((d) => d.value === true).map((d) => d.name);
    return { databases, selected };
  }, [userData]);

  // apply changes
  const handleApplyAuthorsVisible = ({ id }: SelectOption<string>) => {
    setParams({ [UserDataKeys.MIN_AUTHOR_RESULT]: id });
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
        <DescriptionCollapse body={authorsPerResultsDescription} label="Authors Visible per Result">
          {({ btn, content }) => (
            <FormControl>
              <Select<SelectOption<string>>
                value={authorsVisibleValue}
                options={authorsVisibleOptions}
                stylesTheme="default"
                onChange={handleApplyAuthorsVisible}
                label={
                  <Box mb="2">
                    <FormLabel htmlFor="authors-per-result-selector" fontSize={['sm', 'md']}>
                      {'Authors Visible per Result'} {btn}
                    </FormLabel>
                    {content}
                  </Box>
                }
                id="authors-per-result-selector"
                instanceId="authors-per-result-selector-instance"
                hideLabel={false}
              />
            </FormControl>
          )}
        </DescriptionCollapse>
        <DescriptionCollapse body={defaultActionExternalLinksDescription} label="Authors Visible per Result">
          {({ btn, content }) => (
            <FormControl>
              <Select<SelectOption<string>>
                value={externalLinksValue}
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
              <CheckboxGroup onChange={handleApplyDatabases} value={databasesValue.selected}>
                <Stack direction="row" id="default-collections">
                  {databasesValue.databases.map((o) => (
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

  return Promise.resolve({
    props: {},
  });
}, userGSSP);
