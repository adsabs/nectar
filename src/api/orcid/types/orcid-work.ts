export interface IOrcidWork {
  'created-date': EdDate;
  'last-modified-date': EdDate;
  source: Source;
  'put-code': number | string;
  path: string;
  title: Title;
  'journal-title': JournalTitle;
  'short-description': string;
  citation: null;
  type: string;
  'publication-date': PublicationDate;
  'external-ids': ExternalIDS;
  url: null;
  contributors: Contributors;
  'language-code': null;
  country: null;
  visibility: string;
}

export interface Contributors {
  contributor: Contributor[];
}

export interface Contributor {
  'contributor-orcid': null;
  'credit-name': JournalTitle;
  'contributor-email': null;
  'contributor-attributes': ContributorAttributes;
}

export interface ContributorAttributes {
  'contributor-sequence': null;
  'contributor-role': ContributorRole;
}

export type ContributorRole = 'AUTHOR';

export interface JournalTitle {
  value: string;
}

export interface EdDate {
  value: number;
}

export interface ExternalIDS {
  'external-id': ExternalID[];
}

export interface ExternalID {
  'external-id-type': string;
  'external-id-value': string;
  'external-id-url': null;
  'external-id-relationship': string;
}

export interface PublicationDate {
  year: JournalTitle;
  month: JournalTitle;
  day: null;
  'media-type': null;
}

export interface Source {
  'source-orcid': null;
  'source-client-id': SourceClientID;
  'source-name': JournalTitle;
}

export interface SourceClientID {
  uri: string;
  path: string;
  host: string;
}

export interface Title {
  title: JournalTitle;
  subtitle: null;
  'translated-title': null;
}
