import { Select, SelectOption, SettingsLayout } from '@components';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

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

  return (
    <SettingsLayout title="Library Link Server">
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
}, userGSSP);
