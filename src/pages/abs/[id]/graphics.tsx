import AdsApi, { IADSApiGraphicsParams, IADSApiGraphicsResponse, IDocsEntity, IUserData } from '@api';
import { metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { dehydrate, QueryClient } from 'react-query';
interface IGraphicsPageProps {
  graphics?: IADSApiGraphicsResponse;
  originalDoc: IDocsEntity;
  error?: string;
}

const GraphicsPage: NextPage<IGraphicsPageProps> = (props: IGraphicsPageProps) => {
  const { originalDoc, graphics, error } = props;
  return (
    <AbsLayout doc={originalDoc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Graphics from</span> <div className="text-2xl">{originalDoc.title}</div>
          </h2>
          {error ?? <div className="my-2" dangerouslySetInnerHTML={{ __html: graphics.header }}></div>}
        </div>
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : (
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

export const getServerSideProps: GetServerSideProps<IGraphicsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const params: IADSApiGraphicsParams = {
    bibcode: query.id,
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.graphics.query(params);
  const originalDoc = await adsapi.search.getDocument(query.id, [
    ...abstractPageNavDefaultQueryFields,
    ...metatagsQueryFields,
  ]);

  const queryClient = new QueryClient();
  if (!originalDoc.notFound && !originalDoc.error) {
    const { bibcode } = originalDoc.doc;
    void (await queryClient.prefetchQuery(['hasGraphics', bibcode], () => fetchHasGraphics(adsapi, bibcode)));
    void (await queryClient.prefetchQuery(['hasMetrics', bibcode], () => fetchHasMetrics(adsapi, bibcode)));
  }

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? {
        props: {
          graphics: null,
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
          error: 'Unable to get results',
        },
      }
    : {
        props: {
          graphics: result.value,
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
        },
      };
};
