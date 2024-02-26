import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CustomInfoMessage, LibraryEntityPane, LoadingMessage } from '@components';
import { useGetLibraryEntity } from '@api';
import { parseAPIError } from '@utils';
import Head from 'next/head';

const PublicLibraries: NextPage = () => {
  const router = useRouter();

  const id = router.query.id?.[0] ?? null;

  const { data, isLoading, error } = useGetLibraryEntity({
    id,
  });

  return (
    <>
      <Head>
        <title>NASA Science Explorer - Public Library - {data?.metadata?.name ?? ''}</title>
      </Head>
      {id && isLoading && <LoadingMessage message="Loading" />}
      {id && error && <CustomInfoMessage status="error" title="Error" description={parseAPIError(error)} />}
      {id && data && <LibraryEntityPane id={data.metadata.id} publicView />}
    </>
  );
};

export default PublicLibraries;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
