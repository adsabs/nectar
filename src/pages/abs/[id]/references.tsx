import AdsApi, { IADSApiSearchParams, IDocsEntity, IUserData } from '@api';
import { metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { dehydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';
import qs from 'qs';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { AbstractRefList } from '@components/AbstractRefList';
import Head from 'next/head';
export interface ICitationsPageProps {
  docs: IDocsEntity[];
  originalDoc: IDocsEntity;
  error?: string;
}

const getQueryParams = (id: string | string[]): IADSApiSearchParams => {
  const idStr = Array.isArray(id) ? id[0] : id;
  return {
    q: `references(identifier:${idStr})`,
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
    sort: ['first_author asc'],
  };
};

const ReferencesPage: NextPage<ICitationsPageProps> = (props: ICitationsPageProps) => {
  const { docs, originalDoc, error } = props;
  const { query } = useRouter();

  return (
    <AbsLayout doc={originalDoc} titleDescription="Paper referenced by">
      <Head>
        <title>NASA Science Explorer - References - {originalDoc.title[0]}</title>
      </Head>
      {error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <AbstractRefList
          query={getQueryParams(query.id)}
          docs={docs}
          resultsLinkHref={`/search?${qs.stringify({
            q: `references(bibcode:${originalDoc.bibcode})`,
            sort: 'first_author asc',
          })}`}
          numFound={originalDoc['[citations]'].num_references}
        />
      )}
    </AbsLayout>
  );
};

export default ReferencesPage;

export const getServerSideProps: GetServerSideProps<ICitationsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(getQueryParams(query.id));
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
          docs: [],
          originalDoc: originalDoc.doc,
          error: 'Unable to get results',
          dehydratedState: dehydrate(queryClient),
        },
      }
    : result.value.response.numFound === 0
    ? {
        props: {
          docs: [],
          originalDoc: originalDoc.doc,
          error: 'No results found',
          dehydratedState: dehydrate(queryClient),
        },
      }
    : {
        props: {
          docs: result.value.response.docs,
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
        },
      };
};
