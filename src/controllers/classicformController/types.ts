import { SolrSort } from '@api';

export type LogicAndOr = 'and' | 'or';
export type LogicAll = 'and' | 'or' | 'boolean';

export interface ClassicFormParams {
  limit_astronomy: boolean;
  limit_physics: boolean;
  limit_general: boolean;
  logic_author: LogicAndOr;
  logic_object: LogicAndOr;
  logic_title: LogicAll;
  logic_abstract_keywords: LogicAll;
  property_referreed_only: boolean;
  property_physics: boolean;

  pubdate_start?: [number, number];
  pubdate_end?: [number, number];
  author: string[];
  object: string[];
  title: string[];
  abstract_keywords: string[];
  bibstems: string[];
  sort: SolrSort;
}

export type RawClassicFormParams = {
  [Property in keyof ClassicFormParams]: string;
};
