import AdsApi, { IADSApiSearchParams, IDocsEntity, IUserData } from '@api';
import { metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { SimpleResultList } from '@components/ResultList';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { normalizeURLParams } from 'src/utils';
export interface ICitationsPageProps {
  docs: IDocsEntity[];
  originalDoc: IDocsEntity;
  error?: string;
  hasGraphics: boolean;
  hasMetrics: boolean;
}

const getQueryParams = (id: string | string[]): IADSApiSearchParams => {
  const idStr = Array.isArray(id) ? id[0] : id;
  return {
    q: `similar(identifier:${idStr})`,
    fl: ['bibcode', 'title', 'author', '[fields author=10]', 'author_count', 'pubdate'],
    sort: ['score desc'],
  };
};

const SimilarPage: NextPage<ICitationsPageProps> = (props: ICitationsPageProps) => {
  const { docs, originalDoc, error, hasGraphics, hasMetrics } = props;
  const { query } = useRouter();

  return (
    <AbsLayout doc={originalDoc} hasGraphics={hasGraphics} hasMetrics={hasMetrics}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Papers similar to</span> <div className="text-2xl">{originalDoc.title}</div>
          </h2>
        </div>
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : (
          <SimpleResultList numFound={docs.length} query={getQueryParams(query.id)} docs={docs} hideCheckboxes={true} />
        )}
      </article>
    </AbsLayout>
  );
};

export default SimilarPage;

export const getServerSideProps: GetServerSideProps<ICitationsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const params: IADSApiSearchParams = {
    q: `similar(identifier:${query.id})`,
    fl: ['bibcode', 'title', 'author', '[fields author=10]', 'author_count', 'pubdate'],
    sort: ['score desc'],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);
  const originalDoc = await adsapi.search.getDocument(query.id, [
    ...abstractPageNavDefaultQueryFields,
    ...metatagsQueryFields,
  ]);
  const hasGraphics =
    !originalDoc.notFound && !originalDoc.error
      ? await adsapi.graphics.hasGraphics(adsapi, originalDoc.doc.bibcode)
      : false;
  const hasMetrics =
    !originalDoc.notFound && !originalDoc.error
      ? await adsapi.metrics.hasMetrics(adsapi, originalDoc.doc.bibcode)
      : false;

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? { props: { docs: [], originalDoc: originalDoc.doc, hasGraphics, hasMetrics, error: 'Unable to get results' } }
    : result.value.numFound === 0
    ? { props: { docs: [], originalDoc: originalDoc.doc, hasGraphics, hasMetrics, error: 'No results found' } }
    : {
        props: {
          docs: result.value.docs,
          originalDoc: originalDoc.doc,
          hasGraphics,
          hasMetrics,
        },
      };
};
