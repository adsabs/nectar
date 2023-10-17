import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { LibrariesLayout } from '@components/Layout/LibrariesLayout';
import { CustomInfoMessage, LibraryEntityPane, LoadingMessage } from '@components';
import { useGetLibraryEntity } from '@api';
import { parseAPIError } from '@utils';

const PublicLibraries: NextPage = () => {
  const router = useRouter();

  const id = router.query.id?.[0] ?? null;

  const { data, isLoading, error } = useGetLibraryEntity({
    id,
  });

  return (
    <LibrariesLayout title="NASA Science Explorer - Public Library">
      {id && isLoading && <LoadingMessage message="Loading" />}
      {id && error && <CustomInfoMessage status="error" title="Error" description={parseAPIError(error)} />}
      {id && data && <LibraryEntityPane library={data} publicView />}
    </LibrariesLayout>
  );
};

export default PublicLibraries;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
