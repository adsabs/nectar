import AdsApi, { IADSApiBootstrapData, IADSApiSearchParams, IDocsEntity } from '@api';
import { AbstractSideNav, ResultList } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { normalizeURLParams } from 'src/utils';

export interface ICitationsPageProps {
  docs: IDocsEntity[];
  originalDoc: IDocsEntity;
  error?: string;
}

const ReferencesPage: NextPage<ICitationsPageProps> = (props) => {
  const { docs, originalDoc, error } = props;

  console.log(error);

  return (
    <section className="flex space-x-2">
      <Head>
        <title>References | {originalDoc.title}</title>
      </Head>
      <AbstractSideNav doc={originalDoc} />
      <article aria-labelledby="title" className="flex-1 my-8 px-4 py-8 w-full bg-white shadow sm:rounded-lg">
        <div className="border-b border-gray-200 sm:pb-0 md:pb-3">
          <h2 className="prose-xl text-gray-900 font-medium leading-6" id="title">
            <em>Papers referenced by</em> {originalDoc.title}
          </h2>
        </div>
        <ResultList docs={docs} hideCheckboxes={true} showActions={false} />
      </article>
    </section>
  );
};

export default ReferencesPage;

const getOriginalDoc = async (api: AdsApi, id: string) => {
  const result = await api.search.query({
    q: `identifier:${id}`,
    fl: [...abstractPageNavDefaultQueryFields, 'title'],
  });
  return result.isOk() ? result.value.docs[0] : null;
};

export const getServerSideProps: GetServerSideProps<ICitationsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IADSApiBootstrapData };
  };
  const userData = request.session.userData;
  const params: IADSApiSearchParams = {
    q: `references(identifier:${query.id})`,
    fl: ['bibcode', 'title', 'author', '[fields author=3]', 'author_count', 'pubdate'],
    sort: ['date desc'],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);
  const originalDoc = await getOriginalDoc(adsapi, query.id);

  if (result.isErr()) {
    return { props: { docs: [], originalDoc, error: result.error.message } };
  }

  return {
    props: {
      docs: result.value.docs,
      originalDoc,
    },
  };
};
