import { IADSApiSearchParams, IADSApiSearchResponse } from '@api';
import { SimpleResultList } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { Pagination } from '@components/ResultList/Pagination';
import { APP_DEFAULTS } from '@config';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { composeNextGSSP, normalizeURLParams } from '@utils';
import { searchKeys, useGetAbstract, useGetToc } from '@_api/search';
import { getTocParams } from '@_api/search/models';
import { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';

interface IVolumePageProps {
  id: string;
  defaultParams: {
    start: IADSApiSearchParams['start'];
  };
  error?: {
    status?: string;
    message?: string;
  };
}

const VolumePage: NextPage<IVolumePageProps> = (props: IVolumePageProps) => {
  const { id, error, defaultParams } = props;
  const {
    data: {
      docs: [doc],
    },
  } = useGetAbstract({ id });

  const [start, setStart] = useState(defaultParams?.start ?? 0);
  const params = useMemo(() => ({ bibcode: doc.bibcode, start }), [doc, start]);
  const router = useRouter();

  const handlePageChange = (page: number, start: number) => {
    void router.push(
      { pathname: '/abs/[id]/citations', query: { p: page } },
      { pathname: `/abs/${doc.bibcode}/citations`, query: { p: page } },
      {
        shallow: true,
      },
    );
    setStart(start);
  };

  const { data, isSuccess } = useGetToc(params, { keepPreviousData: true });
  const tocParams = getTocParams(doc.bibcode, 0);

  return (
    <AbsLayout doc={doc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Papers in the same volume as</span> <div className="text-2xl">{doc.title}</div>
          </h2>
        </div>
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : (
          <>
            <Link href={{ pathname: '/search', query: { q: tocParams.q, sort: tocParams.sort } }}>
              <a className="link text-sm">View as search results</a>
            </Link>
            {isSuccess && <SimpleResultList docs={data.docs} hideCheckboxes={true} indexStart={params.start} />}
            {isSuccess && <Pagination totalResults={data.numFound} numPerPage={10} onPageChange={handlePageChange} />}
          </>
        )}
      </article>
    </AbsLayout>
  );
};

export default VolumePage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const api = (await import('@_api/api')).default;
  const { fetchSearch } = await import('@_api/search');
  const axios = (await import('axios')).default;
  api.setToken(ctx.req.session.userData.access_token);
  const query = normalizeURLParams(ctx.query);
  const parsedPage = parseInt(query.p, 10);
  const page = isNaN(parsedPage) || Math.abs(parsedPage) >= 100 ? 1 : Math.abs(parsedPage);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      response: {
        docs: [{ bibcode }],
      },
    } = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.abstract(query.id));

    const params = getTocParams(bibcode, (page - 1) * APP_DEFAULTS.RESULT_PER_PAGE);
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.toc({ bibcode, start: params.start }),
      queryFn: fetchSearch,
      meta: { params },
    }));

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        defaultParams: {
          start: params.start,
        },
      },
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return {
        props: {
          error: {
            status: e.response.status,
            message: e.message,
          },
        },
      };
    }
    return {
      props: {
        error: {
          status: 500,
          message: 'Unknown server error',
        },
      },
    };
  }
});
