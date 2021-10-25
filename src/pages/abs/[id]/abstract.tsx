import AdsApi, { IDocsEntity, IUserData, SolrSort } from '@api';
import { AbstractSources, metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { createUrlByType } from '@components/AbstractSources/linkGenerator';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { useAPI } from '@hooks';
import clsx from 'clsx';
import { GetServerSideProps, NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';
import { useEffect, useState } from 'react';
import { normalizeURLParams, isBrowser } from 'src/utils';
export interface IAbstractPageProps {
  doc?: IDocsEntity;
  error?: string;
  params: {
    q: string;
    fl: string[];
    sort: SolrSort[];
  };
  hasGraphics: boolean;
  hasMetrics: boolean;
}

const MAX_AUTHORS = 50;

const AbstractPage: NextPage<IAbstractPageProps> = (props: IAbstractPageProps) => {
  const { doc, error, params, hasGraphics, hasMetrics } = props;

  const [showNumAuthors, setShowNumAuthors] = useState<number>(MAX_AUTHORS);

  const [aff, setAff] = useState({ show: false, data: [] as string[] });

  // onComponentDidMount
  useEffect(() => {
    if (doc && showNumAuthors > doc.author.length) {
      setShowNumAuthors(doc.author.length);
    }
  }, [doc]);

  const { api } = useAPI();

  const handleShowAllAuthors = () => {
    setShowNumAuthors(doc.author.length);
  };

  const handleShowLessAuthors = () => {
    setShowNumAuthors(Math.min(doc.author.length, MAX_AUTHORS));
  };

  const handleShowAff = () => {
    if (aff.data.length === 0) {
      params.fl = ['aff'];
      void api.search.query(params).then((result) => {
        result.match(
          (res) => {
            setAff({ show: true, data: res.docs[0].aff });
          },
          () => {
            return;
          },
        );
      });
    } else {
      setAff({ show: true, data: aff.data });
    }
  };

  const handleHideAff = () => {
    setAff({ show: false, data: aff.data });
  };

  const authorsClass = clsx(!aff.show ? 'flex flex-wrap' : '', 'prose-sm pb-3 pl-2 text-gray-700');

  const authorClass = clsx(!aff.show ? 'flex items-center' : '');

  const authorNameClass = clsx(!aff.show ? 'link pr-1' : 'link');

  return (
    <AbsLayout doc={doc} hasGraphics={hasGraphics} hasMetrics={hasMetrics}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : (
          <>
            <div className="pb-1">
              <h2 className="prose-xl pb-5 text-gray-900 text-2xl font-medium leading-8" id="title">
                {doc.title}
              </h2>
              {isBrowser() ? (
                <>
                  {aff.show ? (
                    <button className="badge ml-1" onClick={handleHideAff}>
                      hide affiliations
                    </button>
                  ) : (
                    <button className="badge ml-1" onClick={handleShowAff}>
                      show affiliations
                    </button>
                  )}

                  {doc.author.length > showNumAuthors ? (
                    <span>
                      <button className="badge" onClick={handleShowAllAuthors}>
                        show all authors
                      </button>
                    </span>
                  ) : showNumAuthors > MAX_AUTHORS ? (
                    <button className="badge" onClick={handleShowLessAuthors}>
                      show less authors
                    </button>
                  ) : null}
                </>
              ) : null}
              {doc.author && doc.author.length > 0 && (
                <div className={authorsClass}>
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
                      <div key={index} className={authorClass}>
                        <Link
                          href={`/search?q=${encodeURIComponent(`author:"${a}"`)}&sort=${encodeURIComponent(
                            'date desc, bibcode desc',
                          )}`}
                        >
                          <a className={authorNameClass}>{a}</a>
                        </Link>
                        {'  '}
                        {orcid && (
                          <Link
                            href={{
                              pathname: '/search',
                              query: { q: `orcid:${orcid}`, sort: 'date desc, bibcode desc' },
                            }}
                          >
                            <a style={{ height: 20 }}>
                              <Image src="/img/orcid-active.svg" width="20" height="20" alt="Search by ORCID" />
                            </a>
                          </Link>
                        )}
                        {'  '}
                        {aff.show ? <>({aff.data[index]})</> : null}
                        ;&nbsp;
                      </div>
                    );
                  })}
                  &nbsp;
                  {isBrowser() && doc.author.length > showNumAuthors ? (
                    <a onClick={handleShowAllAuthors} className="link italic">
                      {` and ${doc.author.length - showNumAuthors} more`}
                    </a>
                  ) : null}
                  {!isBrowser() && doc.author.length > showNumAuthors ? (
                    <span className="italic">{` and ${doc.author.length - showNumAuthors} more`}</span>
                  ) : null}
                </div>
              )}
            </div>

            <AbstractSources doc={doc} />
            {isNil(doc.abstract) ? (
              <div className="prose-lg p-3">No Abstract</div>
            ) : (
              <div className="prose-lg p-3" dangerouslySetInnerHTML={{ __html: doc.abstract }}></div>
            )}
            <Details doc={doc} />
          </>
        )}
      </article>
    </AbsLayout>
  );
};

export default AbstractPage;

interface IDetailsProps {
  doc: IDocsEntity;
}
const Details = ({ doc }: IDetailsProps) => {
  const arxiv = (doc.identifier ?? ([] as string[])).find((v) => /^arxiv/i.exec(v));

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
      ...metatagsQueryFields,
      'author_count',
      'comment',
      'data',
      'orcid_pub',
      'orcid_user',
      'orcid_other',
      'property',
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);
  const hasGraphics =
    result.isOk() && result.value.numFound > 0
      ? await adsapi.graphics.hasGraphics(adsapi, result.value.docs[0].bibcode)
      : false;
  const hasMetrics =
    result.isOk() && result.value.numFound > 0
      ? await adsapi.metrics.hasMetrics(adsapi, result.value.docs[0].bibcode)
      : false;

  return result.isErr()
    ? { props: { doc: null, hasGraphics, hasMetrics, params, error: 'Unable to get abstract' } }
    : result.value.numFound === 0
    ? { notFound: true }
    : {
        props: {
          doc: result.value.docs[0],
          params,
          hasGraphics,
          hasMetrics,
        },
      };
};
