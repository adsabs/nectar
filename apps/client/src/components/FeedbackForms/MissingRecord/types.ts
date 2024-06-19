import { Database } from '@/api/search';
import { IResourceUrl } from '@/lib';
import { ArrayChange, Change } from 'diff';

export interface IAuthor {
  name: string;
  aff: string;
  orcid: string;
}

export const referenceTypes = ['Raw Text', 'DOI', 'Bibcode'] as const;

export type ReferenceType = typeof referenceTypes[number];

export interface IReference {
  type: ReferenceType;
  reference: string;
}

export interface IKeyword {
  value: string;
}

export type FormValues = {
  name: string;
  email: string;
  isNew: boolean;
  bibcode: string;
  collection: Database[];
  title: string;
  noAuthors: boolean;
  authors: IAuthor[];
  publication: string;
  pubDate: string;
  urls: IResourceUrl[];
  abstract: string;
  keywords: IKeyword[];
  references: IReference[];
  comments: string;
};

export type DiffSection = {
  label: string;
  changes: (ArrayChange<string> | Change)[];
  type: 'array' | 'text';
  newValue: string;
};
