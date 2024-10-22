import { SolrSort } from '@/api/models';

export type LogicChoice = 'and' | 'or' | 'boolean';
export type CollectionChoice = 'astronomy' | 'physics' | 'general' | 'earthscience';
export type PropertyChoice = 'refereed-only' | 'articles-only';

export interface IClassicFormState {
  limit: CollectionChoice[];
  author: string;
  logic_author: LogicChoice;
  object: string;
  logic_object: LogicChoice;
  pubdate_start: string;
  pubdate_end: string;
  title: string;
  logic_title: LogicChoice;
  abstract_keywords: string;
  logic_abstract_keywords: LogicChoice;
  property: PropertyChoice[];
  bibstems: string;
  sort: SolrSort[];
}

export interface IRawClassicFormState {
  limit: string[];
  author: string;
  logic_author: string;
  object: string;
  logic_object: string;
  pubdate_start: string;
  pubdate_end: string;
  title: string;
  logic_title: string;
  abstract_keywords: string;
  logic_abstract_keywords: string;
  property: string[];
  bibstems: string;
  sort: string[];
}
