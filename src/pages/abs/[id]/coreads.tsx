import AdsApi, { IADSApiSearchParams, IDocsEntity, IUserData } from '@api';
import { AbstractRefList, metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { dehydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';
import qs from 'qs';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import Head from 'next/head';

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
    <AbsLayout doc={originalDoc} titleDescription="Papers also read by those who read">
      <Head>
        <title>NASA Science Explorer - Coreads - {originalDoc.title[0]}</title>
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
            q: `trending(bibcode:${originalDoc.bibcode}) -bibcode:${originalDoc.bibcode}`,
            sort: 'score desc',
          })}`}
          numFound={parseInt(originalDoc.read_count) ?? 0}
        />
      )}
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
