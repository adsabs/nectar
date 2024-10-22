import { AppRuntimeConfig } from '@/types';
import getConfig from 'next/config';
import { ReactElement } from 'react';
import { getFormattedNumericPubdate } from '@/utils/common/formatters';
import { Esources, IDocsEntity } from '@/api/search/types';
import { logger } from '@/logger';

const getBaseUrl = () => {
  try {
    return (getConfig() as AppRuntimeConfig).serverRuntimeConfig?.baseCanonicalUrl ?? '';
  } catch (err) {
    logger.error({ err }, 'Error caught resolving base url');
    return '';
  }
};

const baseUrl = getBaseUrl();
const LINKGWAY_BASE_URL = `${baseUrl}/link_gateway`;
interface IMetatagsProps {
  doc: IDocsEntity;
}

export const metatagsQueryFields: Partial<keyof IDocsEntity>[] = [
  'abstract',
  'aff',
  'author',
  'bibcode',
  'bibstem',
  'doctype',
  'doi',
  'esources',
  'identifier',
  'isbn',
  'issn',
  'issue',
  'keyword',
  'page',
  'page_range',
  'pub',
  'pubdate',
  'title',
  'volume',
];

export const Metatags = (props: IMetatagsProps): ReactElement => {
  const { doc } = props;

  if (!doc) {
    return null;
  }

  const getLastPage = (page_range: string) => {
    const pages = page_range.split('-');
    return pages[1];
  };

  const getArXiv = (identifier: string[]) => {
    return identifier.find((id) => {
      return id.startsWith('arXiv');
    });
  };

  const title = doc.title ? doc.title.join('; ') : '';

  const url = `${baseUrl}/abs/${doc.bibcode}/abstract`;

  const logo = `${baseUrl}/styles/images/transparent_logo.svg`;

  const formatted_numeric_pubdate = doc.pubdate ? getFormattedNumericPubdate(doc.pubdate) ?? '' : '';

  const last_page = doc.page_range ? getLastPage(doc.page_range) : '';

  const arXiv = doc.identifier ? getArXiv(doc.identifier) : '';

  const authors = doc.author ? doc.author.slice(0, 50) : [];

  return (
    <>
      <link rel="canonical" href={`${baseUrl}/abs/${doc.bibcode}/abstract`} />

      <meta name="description" content={doc.abstract} />

      <meta property="og:type" content={doc.doctype} />

      <meta property="og:title" content={title} />

      <meta property="og:site_name" content="NASA/ADS" />

      <meta property="og:description" content={doc.abstract} />

      <meta property="og:url" content={url} />

      <meta property="og:image" content={logo} />

      {doc.pubdate && <meta property="article:published_time" content={formatted_numeric_pubdate} />}

      {doc.author && authors.map((a, i) => <meta key={`aa-${i}`} name="article:author" content={a} />)}

      {doc.doctype === 'Proceedings' ? (
        doc.bibstem && doc.bibstem.length > 0 && <meta name="citation_conference" content={doc.bibstem[0]} />
      ) : doc.pub ? (
        <meta name="citation_journal_title" content={doc.pub} />
      ) : null}

      {doc.pubdate && <meta name="citation_date" content={formatted_numeric_pubdate} />}

      {doc.author && authors.map((a, i) => <meta key={`ca-${i}`} name="citation_authors" content={a} />)}

      {doc.title && <meta name="citation_title" content={title} />}

      {doc.pubdate && <meta name="citation_date" content={formatted_numeric_pubdate} />}

      {doc.volume && <meta name="citation_volume" content={doc.volume} />}

      {doc.issue && <meta name="citation_issue" content={doc.issue} />}

      {doc.page && <meta name="citation_firstpage" content={doc.page} />}

      {doc.doi && doc.doi.length > 0 && <meta name="citation_doi" content={doc.doi[0]} />}

      {doc.issn && doc.issn.length > 0 && <meta name="citation_issn" content={doc.issn[0]} />}

      {doc.isbn && doc.isbn.length > 0 && <meta name="citation_isbn" content={doc.isbn[0]} />}

      <meta name="citation_language" content="en" />

      {doc.keyword && <meta name="citation_keywords" content={doc.keyword.join('; ')} />}

      {doc.doctype === 'PhD Thesis' && <meta name="citation_dissertation_name" content="Phd" />}

      {doc.doctype === 'Masters Thesis' && <meta name="citation_dissertation_name" content="MS" />}

      <meta name="citation_abstract_html_url" content={url} />

      {doc.pubdate && <meta name="citation_publication_date" content={formatted_numeric_pubdate} />}

      {doc.aff && doc.aff.map((a) => <meta key={a} name="citation_author_institution" content={a} />)}

      {doc.esources && doc.esources.find((e) => e === Esources.PUB_PDF) && (
        <meta name="citation_pdf_url" content={`${LINKGWAY_BASE_URL}/${doc.bibcode}/PUB_PDF`} />
      )}

      {doc.page_range && <meta name="citation_lastpage" content={last_page} />}

      {arXiv !== '' && <meta name="citation_arxiv_id" content={arXiv} />}

      <link title="schema(PRISM)" rel="schema.prism" href="http://prismstandard.org/namespaces/1.2/basic/" />

      {doc.pubdate && <meta name="prism.publicationDate" content={formatted_numeric_pubdate} />}

      {doc.bibstem && doc.bibstem.length > 0 && <meta name="prism.publicationName" content={doc.bibstem[0]} />}

      {doc.issn && doc.issn.length > 0 && <meta name="prism.issn" content={doc.issn[0]} />}

      {doc.volume && <meta name="prism.volume" content={doc.volume} />}

      {doc.page && <meta name="prism.startingPage" content={doc.page} />}

      {doc.page_range && <meta name="prism.endingPage" content={last_page} />}

      <link title="schema(DC)" rel="schema.dc" href="http://purl.org/dc/elements/1.1/" />

      {doc.doi && doc.doi.length > 0 && <meta name="dc.identifier" content={`doi:${doc.doi[0]}`} />}

      {doc.pubdate && <meta name="dc.date" content={formatted_numeric_pubdate} />}

      {doc.bibstem && doc.bibstem.length > 0 && <meta name="dc.source" content={doc.bibstem[0]} />}

      <meta name="dc.title" content={title} />

      {doc.author && authors.map((a, i) => <meta key={`dcc-${i}`} name="dc.creator" content={a} />)}

      <meta name="twitter:card" content="summary_large_image" />

      <meta name="twitter:description" content={doc.abstract} />

      <meta name="twitter:title" content={title} />

      <meta name="twitter:site" content="@adsabs" />

      <meta name="twitter:domain" content="NASA/ADS" />

      <meta name="twitter:image:src" content={logo} />

      <meta name="twitter:creator" content="@adsabs" />
    </>
  );
};
