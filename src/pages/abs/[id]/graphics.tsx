import { IADSApiSearchResponse } from '@api';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { composeNextGSSP, normalizeURLParams } from '@utils';
import { fetchGraphics, graphicsKeys, useGetGraphics } from '@_api/graphics';
import { searchKeys, useGetAbstract } from '@_api/search';
import { GetServerSideProps, NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';
import { toast } from 'react-toastify';
interface IGraphicsPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const GraphicsPage: NextPage<IGraphicsPageProps> = (props: IGraphicsPageProps) => {
  const { id } = props;
  const router = useRouter();

  const {
    data: {
      docs: [doc],
    },
  } = useGetAbstract({ id });

  const {
    data: graphics,
    isError,
    isSuccess,
    error,
  } = useGetGraphics(doc.bibcode, { keepPreviousData: true, retry: false });

  useEffect(() => {
    if (isError) {
      void router.replace('/abs/[id]/abstract', `/abs/${id}/abstract`);
      toast(error, { type: 'error' });
    }
  }, [isError]);

  return (
    <AbsLayout doc={doc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Graphics from</span> <div className="text-2xl">{doc.title}</div>
          </h2>
          {isError ?? <div className="my-2" dangerouslySetInnerHTML={{ __html: graphics.header }}></div>}
        </div>
        {isError && <div className="flex items-center justify-center w-full h-full text-xl">No Results!</div>}
        {isSuccess && (
          <div className="flex flex-wrap">
            {graphics.figures.map((figure, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-between m-2 p-2 border-2 border-gray-100 rounded-lg"
                >
                  <Link href={figure.images[0].highres}>
                    <a target="_blank" rel="noreferrer noopener" className="relative">
                      <Image
                        src={figure.images[0].thumbnail}
                        width="150"
                        height="150"
                        className="p-5"
                        alt={figure.figure_label}
                      ></Image>
                    </a>
                  </Link>
                  <span aria-hidden="true">{figure.figure_label}</span>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </AbsLayout>
  );
};

export default GraphicsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const api = (await import('@_api/api')).default;
  const axios = (await import('axios')).default;
  api.setToken(ctx.req.session.userData.access_token);
  const query = normalizeURLParams(ctx.query);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      docs: [{ bibcode }],
    } = queryClient.getQueryData<IADSApiSearchResponse['response']>(searchKeys.abstract(query.id));

    void (await queryClient.prefetchQuery({
      queryKey: graphicsKeys.primary(bibcode),
      queryFn: fetchGraphics,
    }));

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
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
