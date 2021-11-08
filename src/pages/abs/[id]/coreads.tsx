import AdsApi, { IADSApiSearchParams, IDocsEntity, IUserData } from '@api';
import { metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { SimpleResultList } from '@components/ResultList';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { dehydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';
import Link from 'next/link';
import qs from 'qs';

export interface ICitationsPageProps {
  docs: IDocsEntity[];
  originalDoc: IDocsEntity;
  error?: string;
}

const getQueryParams = (id: string | string[]): IADSApiSearchParams => {
  const idStr = Array.isArray(id) ? id[0] : id;
  return {
    q: `trending(identifier:${idStr}) -identifier:${idStr}`,
    fl: [
      'bibcode',
      'title',
      'author',
      '[fields author=10]',
      'author_count',
      'pubdate',
      'bibstem',
      'citation_count',
      '[citations]',
      'esources',
      'property',
      'data',
    ],
    sort: ['score desc'],
  };
};

const CoreadsPage: NextPage<ICitationsPageProps> = (props: ICitationsPageProps) => {
  const { docs, originalDoc, error } = props;
  const { query } = useRouter();

  return (
    <AbsLayout doc={originalDoc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Papers also read by those who read</span> <div className="text-2xl">{originalDoc.title}</div>
          </h2>
        </div>
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : (
          <>
            <Link
              href={`/search?${qs.stringify({
                q: `trending(bibcode:${originalDoc.bibcode}) -bibcode:${originalDoc.bibcode}`,
                sort: 'score desc',
              })}`}
            >
              <a className="link text-sm">View as search results</a>
            </Link>
            <SimpleResultList
              docs={docs}
              query={getQueryParams(query.id)}
              numFound={parseInt(originalDoc.read_count) ?? 0}
              hideCheckboxes={true}
            />
          </>
        )}
      </article>
    </AbsLayout>
  );
};

export default CoreadsPage;

export const getServerSideProps: GetServerSideProps<ICitationsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const adsapi = new AdsApi({ token: userData.access_token });
  const mainResult = await adsapi.search.query(getQueryParams(query.id));
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

  if (originalDoc.notFound || originalDoc.error) {
    return { notFound: true };
  }

  const defaultProps = {
    docs: [],
    originalDoc: originalDoc.doc,
    dehydratedState: dehydrate(queryClient),
  };

  if (mainResult.isErr()) {
    return {
      props: {
        ...defaultProps,
        error: 'Unable to get results',
      },
    };
  }

  const { numFound, docs } = mainResult.value.response;

  return numFound === 0
    ? {
        props: {
          ...defaultProps,
          error: 'No results found',
        },
      }
    : {
        props: {
          ...defaultProps,
          docs,
        },
      };
};
