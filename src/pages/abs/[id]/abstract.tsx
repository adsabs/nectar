import AdsApi, { IADSApiBootstrapData, IDocsEntity, SolrSort } from '@api';
import { AbstractSideNav, AbstractSources } from '@components';
// import katex from 'katex';
import { GetServerSideProps, NextPage } from 'next';
import { isNil } from 'ramda';
import React from 'react';
import { normalizeURLParams } from 'src/utils';

export interface IAbstractPageProps {
  doc?: IDocsEntity;
  error?: Error;
}

const AbstractPage: NextPage<IAbstractPageProps> = (props) => {
  const { doc, error } = props;

  return (
    <div className="flex space-x-2">
      <AbstractSideNav />
      <section aria-labelledby="title" className="flex-1 my-8 px-4 py-8 w-full bg-white shadow sm:rounded-lg">
        <div className="border-b border-gray-200 sm:pb-0 md:pb-3">
          <h2 className="prose-xl text-gray-900 font-medium leading-6" id="title">
            {doc.title}
          </h2>
          <div className="prose-sm text-gray-700">{doc.author.join('; ')}</div>
        </div>
        {isNil(doc.abstract) ? (
          <div className="prose-lg p-3">No Abstract</div>
        ) : (
          <div className="prose-lg p-3" dangerouslySetInnerHTML={{ __html: doc.abstract }}></div>
        )}
        <Details doc={doc} />
      </section>
    </div>
  );
};

export default AbstractPage;

interface IDetailsProps {
  doc: IDocsEntity;
}
const Details = ({ doc }: IDetailsProps) => {
  const entries = [
    { label: 'Publication', value: doc.pub },
    { label: 'Publication Date', value: doc.pubdate },
    { label: 'DOI', value: doc.doi },
    { label: 'Bibcode', value: doc.bibcode },
    { label: 'Keywords', value: doc.keyword },
    { label: 'E-Print Comments', value: doc.comment },
  ];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 border-t border-gray-200 sm:p-0">
        <AbstractSources doc={doc} />
        <dl className="sm:divide-gray-200 sm:divide-y">
          {entries.map(({ label, value }) => (
            <div key={label} className="py-4 sm:grid sm:gap-4 sm:grid-cols-3 sm:px-6 sm:py-5">
              <dt className="text-gray-500 text-sm font-medium">{label}</dt>
              <dd className="mt-1 text-gray-900 text-sm sm:col-span-2 sm:mt-0">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};
export const getServerSideProps: GetServerSideProps<IAbstractPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IADSApiBootstrapData };
  };
  const userData = request.session.userData;
  const params = {
    q: `identifier:${query.id}`,
    fl: [
      'bibcode',
      'title',
      'author',
      '[fields author=3]',
      'author_count',
      'pubdate',
      'abstract',
      'doi',
      'data',
      'keyword',
      'pub',
      'comment',
      'esources',
      'property',
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);

  if (result.isErr()) {
    return { props: { error: result.error } };
  }

  const doc = result.value.docs[0];
  // try {
  //   // attempt to render any math on the abstract
  //   return {
  //     props: {
  //       doc: { ...doc, abstract: katex.renderToString(String.raw`${doc.abstract}`, { throwOnError: true }) },
  //     },
  //   };
  // } catch (e) {
  return {
    props: {
      doc,
    },
  };
  // }
};
