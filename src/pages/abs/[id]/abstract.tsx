import AdsApi, { IDocsEntity, IUserData, SolrSort } from '@api';
import { AbstractSideNav, AbstractSources } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { isNil } from 'ramda';
import React, { useEffect, useState } from 'react';
import { normalizeURLParams } from 'src/utils';
import Link from 'next/link';
import Image from 'next/image';
import { createUrlByType } from '@components/AbstractSources/linkGenerator';

export interface IAbstractPageProps {
  doc?: IDocsEntity;
  error?: Error;
}

const MAX_AUTHORS = 20;

const AbstractPage: NextPage<IAbstractPageProps> = (props: IAbstractPageProps) => {
  const { doc, error } = props;

  const [showNumAuthors, setShowNumAuthors] = useState<number>(MAX_AUTHORS);

  const [showAff, setShowAff] = useState<boolean>(false);

  // onComponentDidMount
  useEffect(() => {
    if (showNumAuthors > doc.author.length) {
      setShowNumAuthors(doc.author.length);
    }
  }, []);

  const handleShowAllAuthors = () => {
    setShowNumAuthors(doc.author.length);
  };

  const handleShowLessAuthors = () => {
    setShowNumAuthors(Math.min(doc.author.length, MAX_AUTHORS));
  };

  return (
    <section className="abstract-page-container">
      <Head>
        <title>{doc.title}</title>
      </Head>
      <AbstractSideNav doc={doc} />
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl pb-5 text-gray-900 text-2xl font-medium leading-6" id="title">
            {doc.title}
          </h2>
          <div className="prose-sm flex flex-wrap pb-3 text-gray-700">
            {doc.author.slice(0, showNumAuthors).map((a, index) => {
              const orcid =
                doc.orcid_pub && doc.orcid_pub[index] !== '-'
                  ? doc.orcid_pub[index]
                  : doc.orcid_user && doc.orcid_user[index] !== '-'
                  ? doc.orcid_user[index]
                  : doc.orcid_other && doc.orcid_other[index] !== '-'
                  ? doc.orcid_other[index]
                  : undefined;
              return (
                <span key={a} className="flex items-center justify-center">
                  <Link
                    href={`/search?q=${encodeURIComponent(`author:"${a}"`)}&sort=${encodeURIComponent(
                      'date desc, bibcode desc',
                    )}`}
                  >
                    <a className="link pl-2 pr-1">{a}</a>
                  </Link>
                  {'  '}
                  {orcid && (
                    <Link
                      href={`/search?q=${encodeURIComponent(`orcid:${orcid}`)}&sort=${encodeURIComponent(
                        `date desc, bibcode desc`,
                      )}`}
                    >
                      <a style={{ height: 20 }}>
                        <Image src="/img/orcid-active.svg" width="20" height="20" alt="Search by ORCID" />
                      </a>
                    </Link>
                  )}
                  {';  '}
                </span>
              );
            })}
            &nbsp;
            {doc.author.length > showNumAuthors ? (
              <a onClick={handleShowAllAuthors} className="link">
                ... more
              </a>
            ) : null}
          </div>
        </div>
        <AbstractSources doc={doc} />
        {isNil(doc.abstract) ? (
          <div className="prose-lg p-3">No Abstract</div>
        ) : (
          <div className="prose-lg p-3" dangerouslySetInnerHTML={{ __html: doc.abstract }}></div>
        )}
        <Details doc={doc} />
      </article>
    </section>
  );
};

export default AbstractPage;

interface IDetailsProps {
  doc: IDocsEntity;
}
const Details = ({ doc }: IDetailsProps) => {
  const arxiv = ((doc.identifier || []) as string[]).find((v) => v.match(/^arxiv/i));

  const entries = [
    { label: 'Publication', value: doc.pub },
    { label: 'Publication Date', value: doc.pubdate },
    { label: 'DOI', value: doc.doi, href: doc.doi && createUrlByType(doc.bibcode, 'doi', doc.doi) },
    { label: 'arXiv', value: arxiv, href: arxiv && createUrlByType(doc.bibcode, 'arxiv', arxiv.split(':')[1]) },
    { label: 'Bibcode', value: doc.bibcode, href: `/abs/${doc.bibcode}/abstract` },
    { label: 'Keywords', value: doc.keyword },
    { label: 'E-Print Comments', value: doc.comment },
  ];

  return (
    <section>
      <div className="mt-2 bg-white border border-gray-100 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-0">
          <dl className="sm:divide-gray-200 sm:divide-y">
            {entries.map(({ label, value, href }) => (
              <div key={label} className="py-4 sm:grid sm:gap-4 sm:grid-cols-3 sm:px-6 sm:py-5">
                <dt className="text-gray-500 text-sm font-medium">{label}</dt>
                <dd className="mt-1 text-gray-900 text-sm sm:col-span-2 sm:mt-0">
                  {href && href !== '' ? (
                    <Link href={href}>
                      <a className="link" target="_blank" rel="noreferrer">
                        {Array.isArray(value) ? value.join('; ') : value}
                      </a>
                    </Link>
                  ) : (
                    <>{Array.isArray(value) ? value.join('; ') : value}</>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export const getServerSideProps: GetServerSideProps<IAbstractPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const params = {
    q: `identifier:${query.id}`,
    fl: [
      ...abstractPageNavDefaultQueryFields,
      'identifier',
      'bibcode',
      'title',
      'author',
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
      'orcid_pub',
      'orcid_user',
      'orcid_other',
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);

  if (result.isErr()) {
    return { props: { error: result.error } };
  }

  const doc = result.value.docs[0];
  return {
    props: {
      doc,
    },
  };
};
