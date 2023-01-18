import { Box, Checkbox, CheckboxGroup, FormControl, FormLabel, Stack } from '@chakra-ui/react';
import { DescriptionCollapse, Select, SelectOption, SettingsLayout } from '@components';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { range } from 'ramda';

const DEFAULT_SETTINGS = {
  numAuthors: {
    options: range(1, 11)
      .map((n) => n.toString())
      .concat(['all']),
    value: '4',
  },
  externalLinks: {
    options: ['Auto', 'Open new tab', 'Open in current tab'],
    value: 'Auto',
  },
  database: {
    value: [
      {
        name: 'Physics',
        value: false,
      },
      {
        name: 'Astronomy',
        value: false,
      },
      {
        name: 'General',
        value: false,
      },
    ],
  },
};

const useGetOptions = () => {
  return {
    authorsVisibleOptions: DEFAULT_SETTINGS.numAuthors.options.map((v) => ({
      id: v,
      label: v,
      value: v,
    })),
    externalLinksOptions: DEFAULT_SETTINGS.externalLinks.options.map((v) => ({
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
  // select options
  const { authorsVisibleOptions, externalLinksOptions } = useGetOptions();

  // initial values
  // TODO get from server
  const authorsVisibleValue = authorsVisibleOptions.find((option) => option.id === DEFAULT_SETTINGS.numAuthors.value);
  const externalLinksValue = externalLinksOptions.find((option) => option.id === DEFAULT_SETTINGS.externalLinks.value);

  // apply changes
  const handleApplyAuthorsVisible = ({ id }: SelectOption<string>) => {
    console.log(id);
  };

  const handleApplyExternalLinks = ({ id }: SelectOption<string>) => {
    console.log(id);
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
              <CheckboxGroup>
                <Stack direction="row" id="default-collections">
                  {DEFAULT_SETTINGS.database.value.map((o) => (
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
