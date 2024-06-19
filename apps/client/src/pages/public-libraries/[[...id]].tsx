import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { CustomInfoMessage, LibraryEntityPane, LoadingMessage } from '@/components';
import { useGetLibraryEntity } from '@/api';
import { parseAPIError, unwrapStringValue } from '@/utils';
import Head from 'next/head';
import { BRAND_NAME_FULL } from '@/config';

const PublicLibraries: NextPage = () => {
  const router = useRouter();

  const id = router.query.id?.[0] ?? null;

  const { data, isLoading, error } = useGetLibraryEntity({
    id,
  });

  return (
    <>
      <Head>
        <title>{`${unwrapStringValue(data?.metadata?.name)} - ${BRAND_NAME_FULL} Public Library`}</title>
      </Head>
      {id && isLoading && <LoadingMessage message="Loading" />}
      {id && error && <CustomInfoMessage status="error" title="Error" description={parseAPIError(error)} />}
      {id && data && <LibraryEntityPane id={data.metadata.id} publicView />}
    </>
  );
};

export default PublicLibraries;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
