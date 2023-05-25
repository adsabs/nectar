import { IOrcidWork } from '@api/orcid/types';
import { lensPath } from 'ramda';
import { Contributor, ExternalID } from '@api/orcid/types/orcid-work';
import { IDocsEntity } from '@api/search/types';

export const orcidLenses = {
  createdDate: lensPath<IOrcidWork, string>(['created-date', 'value']),
  lastModifiedDate: lensPath<IOrcidWork, string>(['last-modified-date', 'value']),
  sourceOrcidIdUri: lensPath<IOrcidWork, string>(['source', 'source-orcid', 'uri']),
  sourceOrcidIdPath: lensPath<IOrcidWork, string>(['source', 'source-orcid', 'path']),
  sourceOrcidIdHost: lensPath<IOrcidWork, string>(['source', 'source-orcid', 'host']),
  sourceClientIdUri: lensPath<IOrcidWork, string>(['source', 'source-client-id', 'uri']),
  sourceClientIdPath: lensPath<IOrcidWork, string>(['source', 'source-client-id', 'path']),
  sourceClientIdHost: lensPath<IOrcidWork, string>(['source', 'source-client-id', 'host']),
  sourceName: lensPath<IOrcidWork, string>(['source', 'source-name', 'value']),
  putCode: lensPath<IOrcidWork, string>(['put-code']),
  path: lensPath<IOrcidWork, string>(['path']),
  title: lensPath<IOrcidWork, string>(['title', 'title', 'value']),
  subtitle: lensPath<IOrcidWork, string>(['title', 'subtitle', 'value']),
  translatedTitle: lensPath<IOrcidWork, string>(['title', 'translated-title', 'value']),
  translatedTitleLang: lensPath<IOrcidWork, string>(['title', 'translated-title', 'language-code']),
  journalTitle: lensPath<IOrcidWork, string>(['journal-title', 'value']),
  shortDescription: lensPath<IOrcidWork, string>(['short-description']),
  citationType: lensPath<IOrcidWork, string>(['citation', 'citation-type']),
  citationValue: lensPath<IOrcidWork, string>(['citation', 'citation-value']),
  type: lensPath<IOrcidWork, string>(['type']),
  publicationDateYear: lensPath<IOrcidWork, string>(['publication-date', 'year', 'value']),
  publicationDateMonth: lensPath<IOrcidWork, string>(['publication-date', 'month', 'value']),
  publicationDateDay: lensPath<IOrcidWork, string>(['publication-date', 'day', 'value']),
  publicationDateMedia: lensPath<IOrcidWork, string>(['publication-date', 'media-type']),
  url: lensPath<IOrcidWork, string>(['url.value']),
  contributor: lensPath<IOrcidWork, Contributor[]>(['contributors', 'contributor']),
  contributorOrcidUri: lensPath<Contributor, string>(['contributor-orcid', 'uri']),
  contributorOrcidPath: lensPath<Contributor, string>(['contributor-orcid', 'path']),
  contributorOrcidHost: lensPath<Contributor, string>(['contributor-orcid', 'host']),
  contributorName: lensPath<Contributor, string>(['credit-name', 'value']),
  contributorEmail: lensPath<Contributor, string>(['contributor-email', 'value']),
  contributorAttributes: lensPath<Contributor, string>(['contributor-attributes']),
  contributorSequence: lensPath<Contributor, string>(['contributor-attributes', 'contributor-sequence']),
  contributorRole: lensPath<Contributor, string>(['contributor-attributes', 'contributor-role']),
  externalId: lensPath<IOrcidWork, ExternalID[]>(['external-ids', 'external-id']),
  externalIdValue: lensPath<ExternalID, string>(['external-id-value']),
  externalIdType: lensPath<ExternalID, string>(['external-id-type']),
  externalIdUrl: lensPath<ExternalID, string>(['external-id-url']),
  externalIdRelationship: lensPath<ExternalID, string>(['external-id-relationship']),
  country: lensPath<IOrcidWork, string>(['country', 'value']),
  visibility: lensPath<IOrcidWork, string>(['visibility', 'value']),
  identifier: lensPath<IOrcidWork, string>(['identifier']),
};

export const adsDocLenses = {
  pubdate: lensPath<IDocsEntity, string>(['pubdate']),
  abstract: lensPath<IDocsEntity, string>(['abstract']),
  bibcode: lensPath<IDocsEntity, string>(['bibcode']),
  pub: lensPath<IDocsEntity, string>(['pub']),
  doi: lensPath<IDocsEntity, string[]>(['doi']),
  author: lensPath<IDocsEntity, string[]>(['author']),
  title: lensPath<IDocsEntity, string[]>(['title']),
  doctype: lensPath<IDocsEntity, string>(['doctype']),
  identifier: lensPath<IDocsEntity, string[]>(['identifier']),
};

export const convertDocType = (docType: string) => {
  switch (docType) {
    case 'article':
      return 'JOURNAL_ARTICLE';
    case 'inproceedings':
      return 'CONFERENCE_PAPER';
    case 'abstract':
      return 'CONFERENCE_ABSTRACT';
    case 'eprint':
      return 'WORKING_PAPER';
    case 'phdthesis':
      return 'DISSERTATION';
    case 'techreport':
      return 'RESEARCH_TECHNIQUE';
    case 'inbook':
      return 'BOOK_CHAPTER';
    case 'circular':
      return 'RESEARCH_TOOL';
    case 'misc':
      return 'OTHER';
    case 'book':
    case 'proceedings':
      return 'BOOK';
    case 'bookreview':
      return 'BOOK_REVIEW';
    case 'erratum':
      return 'JOURNAL_ARTICLE';
    case 'proposal':
      return 'OTHER';
    case 'newsletter':
      return 'NEWSLETTER_ARTICLE';
    case 'catalog':
      return 'DATA_SET';
    case 'intechreport':
      return 'RESEARCH_TECHNIQUE';
    case 'mastersthesis':
      return 'DISSERTATION';
    case 'obituary':
    case 'pressrelease':
      return 'OTHER';
    case 'software':
      return 'RESEARCH_TECHNIQUE';
    case 'talk':
      return 'LECTURE_SPEECH';
    default:
      return 'JOURNAL_ARTICLE';
  }
};
