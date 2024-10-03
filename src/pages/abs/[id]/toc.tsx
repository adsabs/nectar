import { fetchSearch, getTocParams, IDocsEntity, searchKeys, useGetAbstract, useGetToc } from '@/api';
import { AbstractRefList } from '@/components/AbstractRefList';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { useGetAbstractParams } from '@/lib/useGetAbstractParams';
import { GetServerSideProps, NextPage } from 'next';
import { composeNextGSSP } from '@/ssr-utils';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { path } from 'ramda';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils';

const VolumePage: NextPage = () => {
  const router = useRouter();
  const { data: abstractResult } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], abstractResult);

  const { getParams, onPageChange } = useGetAbstractParams(doc?.bibcode);

  const { data, isSuccess } = useGetToc(getParams(), {
    enabled: !!getParams && !!doc?.bibcode,
    keepPreviousData: true,
  });

  const tocParams = useMemo(() => {
    if (doc?.bibcode) {
      return getTocParams(doc.bibcode, 0);
    }
  }, [doc]);

  return (
    <AbsLayout doc={doc} titleDescription="Papers in the same volume as" label="Volume Content">
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          searchLinkParams={tocParams}
        />
      )}
    </AbsLayout>
  );
};

export default VolumePage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  try {
    const { id } = ctx.params as { id: string };
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
      queryKey: searchKeys.toc({ bibcode: id, start: 0 }),
      queryFn: fetchSearch,
      meta: { params: getTocParams(id, 0) },
    });
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (err) {
    logger.error({ err, url: ctx.resolvedUrl }, 'Error fetching details');
    return {
      props: {
        pageError: parseAPIError(err),
      },
    };
  }
});
