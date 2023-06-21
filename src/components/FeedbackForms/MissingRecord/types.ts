export interface IAuthor {
  last: string;
  first: string;
  aff: string;
  orcid: string;
}

export const urlTypes = ['arXiv', 'PDF', 'DOI', 'HTML', 'Other'] as const;

export type UrlType = typeof urlTypes[number];

export interface IUrl {
  type: UrlType;
  url: string;
}

export const referenceTypes = ['Raw Text'] as const;

export type ReferenceType = typeof referenceTypes[number];

export interface IReference {
  type: ReferenceType;
  reference: string;
}
