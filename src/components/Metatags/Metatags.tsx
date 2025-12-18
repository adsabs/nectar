import { AppRuntimeConfig } from '@/types';
import getConfig from 'next/config';
import { Fragment, ReactElement } from 'react';
import { getFormattedNumericPubdate, getFormattedCitationDate } from '@/utils/common/formatters';
import { Esources, IDocsEntity } from '@/api/search/types';
import { logger } from '@/logger';
import { docToJsonld } from '@/components/Metatags/json-ld-abstract/docToJsonld';

const getBaseUrl = () => {
  try {
    return (getConfig() as AppRuntimeConfig).serverRuntimeConfig?.baseCanonicalUrl ?? '';
  } catch (err) {
    logger.error({ err }, 'Error caught resolving base url');
    return '';
  }
};

const baseUrl = getBaseUrl();
const LINKGATEWAY_BASE_URL = `${baseUrl}/link_gateway`;
interface IMetatagsProps {
  doc: IDocsEntity;
}

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

  const encodedCanonicalID = doc.bibcode ? encodeURIComponent(doc.bibcode) : '';
  const url = `${baseUrl}/abs/${encodedCanonicalID}/abstract`;

  const logo = `${baseUrl}/styles/images/transparent_logo.svg`;

  const formatted_numeric_pubdate = doc.pubdate ? getFormattedNumericPubdate(doc.pubdate) ?? '' : '';
  const citation_date = doc.pubdate ? getFormattedCitationDate(doc.pubdate) ?? '' : '';

  const last_page = doc.page_range ? getLastPage(doc.page_range) : '';

  const arXiv = doc.identifier ? getArXiv(doc.identifier) : '';

  const authors = doc.author ? doc.author.slice(0, 50) : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(docToJsonld(doc, baseUrl)) }}
      />

      <link rel="canonical" href={`${baseUrl}/abs/${encodedCanonicalID}/abstract`} />

      <meta name="description" content={doc.abstract} />

      <meta property="og:type" content={doc.doctype} data-highwire="true" />

      <meta property="og:title" content={title} data-highwire="true" />

      <meta property="og:site_name" content="NASA/ADS" data-highwire="true" />

      <meta property="og:description" content={doc.abstract} data-highwire="true" />

      <meta property="og:url" content={url} data-highwire="true" />

      <meta property="og:image" content={logo} data-highwire="true" />

      {doc.pubdate && <meta property="article:published_time" content={citation_date} />}

      {doc.author && authors.map((a, i) => <meta key={`aa-${i}`} name="article:author" content={a} />)}

      {doc.doctype === 'Proceedings' ? (
        doc.bibstem &&
        doc.bibstem.length > 0 && <meta name="citation_conference" content={doc.bibstem[0]} data-highwire="true" />
      ) : doc.pub_raw ? (
        <meta name="citation_journal_title" content={doc.pub_raw} data-highwire="true" />
      ) : doc.pub ? (
        <meta name="citation_journal_title" content={doc.pub} data-highwire="true" />
      ) : null}

      {doc.pubdate && <meta name="citation_date" content={citation_date} data-highwire="true" />}

      {doc.author &&
        authors.map((author, i) => (
          <Fragment key={`author-${i}`}>
            <meta name="citation_author" content={author} data-highwire="true" />
            {doc.aff && doc.aff[i] && (
              <meta name="citation_author_institution" content={doc.aff[i]} data-highwire="true" />
            )}
          </Fragment>
        ))}

      {doc.title && <meta name="citation_title" content={title} data-highwire="true" />}

      {doc.volume && <meta name="citation_volume" content={doc.volume} data-highwire="true" />}

      {doc.issue && <meta name="citation_issue" content={doc.issue} data-highwire="true" />}

      {doc.page && <meta name="citation_firstpage" content={doc.page} data-highwire="true" />}

      {doc.doi && doc.doi.length > 0 && <meta name="citation_doi" content={doc.doi[0]} data-highwire="true" />}

      {doc.issn && doc.issn.length > 0 && <meta name="citation_issn" content={doc.issn[0]} data-highwire="true" />}

      {doc.isbn && doc.isbn.length > 0 && <meta name="citation_isbn" content={doc.isbn[0]} data-highwire="true" />}

      <meta name="citation_language" content="en" data-highwire="true" />

      {doc.keyword &&
        doc.keyword.map((kw, i) => (
          <meta key={`keyword-${i}`} name="citation_keywords" content={kw} data-highwire="true" />
        ))}

      {doc.doctype === 'PhD Thesis' && <meta name="citation_dissertation_name" content="Phd" data-highwire="true" />}

      {doc.doctype === 'Masters Thesis' && <meta name="citation_dissertation_name" content="MS" data-highwire="true" />}

      <meta name="citation_abstract_html_url" content={url} data-highwire="true" />

      {doc.pubdate && <meta name="citation_publication_date" content={citation_date} data-highwire="true" />}

      {doc.esources && doc.esources.find((e) => e === Esources.PUB_PDF) && (
        <meta name="citation_pdf_url" content={`${LINKGATEWAY_BASE_URL}/${doc.bibcode}/PUB_PDF`} data-highwire="true" />
      )}

      {doc.page_range && <meta name="citation_lastpage" content={last_page} data-highwire="true" />}

      {arXiv !== '' && <meta name="citation_arxiv_id" content={arXiv} data-highwire="true" />}

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

      <meta name="twitter:card" content="summary" data-highwire="true" />

      <meta name="twitter:description" content={doc.abstract} data-highwire="true" />

      <meta name="twitter:title" content={title} data-highwire="true" />

      <meta name="twitter:site" content="@adsabs" data-highwire="true" />

      <meta name="twitter:domain" content="NASA/ADS" data-highwire="true" />

      <meta name="twitter:image:src" content={logo} data-highwire="true" />

      <meta name="twitter:creator" content="@adsabs" data-highwire="true" />
    </>
  );
};
