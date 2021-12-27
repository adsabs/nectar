import AdsApi, { IADSApiSearchParams, IDocsEntity, IUserData } from '@api';
import { metatagsQueryFields, AbstractRefLayout } from '@components';
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
export interface ICitationsPageProps {
  docs: IDocsEntity[];
  originalDoc: IDocsEntity;
  error?: string;
}

const getQueryParams = (id: string | string[]): IADSApiSearchParams => {
  const idStr = Array.isArray(id) ? id[0] : id;
  return {
    q: `similar(identifier:${idStr})`,
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

const SimilarPage: NextPage<ICitationsPageProps> = (props: ICitationsPageProps) => {
  const { docs, originalDoc, error } = props;
  const { query } = useRouter();

  return (
    <AbsLayout doc={originalDoc}>
      <AbstractRefLayout titleDescription="Papers similar to" docTitle={originalDoc.title}>
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
              q: `similar(bibcode:${originalDoc.bibcode})`,
              sort: 'score desc',
            })}`}
            numFound={docs.length}
          />
        )}
      </AbstractRefLayout>
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
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);
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
