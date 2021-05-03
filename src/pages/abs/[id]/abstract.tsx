import AdsApi, { IADSApiBootstrapData, IDocsEntity, SolrSort } from '@api';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';
import { normalizeURLParams } from 'src/utils';

export interface IAbstractPageProps {
  doc?: IDocsEntity;
  error?: Error;
}

const AbstractPage: NextPage<IAbstractPageProps> = (props) => {
  const { doc, error } = props;

  return (
    <div className="shadow-md m-2">
      {error && <pre>{JSON.stringify(error)}</pre>}

      <div>{doc?.title}</div>
      <div>{doc?.abstract}</div>
    </div>
  );
};

export default AbstractPage;

export const getServerSideProps: GetServerSideProps<IAbstractPageProps> = async (
  ctx,
) => {
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
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);

  if (result.isErr()) {
    return { props: { error: result.error } };
  }

  return {
    props: {
      doc: result.value.docs[0],
    },
  };
};
