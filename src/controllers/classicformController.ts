import { SolrSort } from '@api';
import { Result, ValidationError } from 'express-validator';
import { NextApiRequest, NextApiResponse } from 'next';
import { isNil } from 'ramda';

type LogicAndOr = 'and' | 'or';
type LogicAll = 'and' | 'or' | 'boolean';
export interface ClassicFormParams {
  limit_astronomy?: boolean;
  limit_physics?: boolean;
  limit_general?: boolean;
  logic_author?: LogicAndOr;
  logic_object?: LogicAndOr;
  logic_title?: LogicAll;
  logic_abstract?: LogicAll;
  property_referreed_only?: boolean;
  property_physics?: boolean;

  pubdate_start?: [number, number];
  pubdate_end?: [number, number];
  author?: string[];
  object?: string[];
  title?: string[];
  abstract_keywords?: string[];
  bibstems?: string[];
  sort?: SolrSort;
}

export function classicformController(
  req: NextApiRequest,
  res: NextApiResponse,
  errors: Result<ValidationError>,
): void {
  const params = req.body as ClassicFormParams;
  const q = buildQuery(params);
  const urlQuery = `q=${q}&sort=${isNil(params.sort) ? 'date desc' : params.sort}`;

  res.redirect(`/search?${urlQuery}`);
}
const formatLogic = (logic: LogicAll | LogicAndOr) => {
  if (logic === 'or') {
    return ' OR ';
  }
  return ' ';
};

const collections = ({ limit_astronomy, limit_general, limit_physics }: ClassicFormParams) => {
  if (!limit_astronomy && !limit_general && !limit_physics) {
    return;
  }
  return `collection:(${[
    limit_astronomy ? 'astronomy' : null,
    limit_physics ? 'physics' : null,
    limit_general ? 'general' : null,
  ]
    .filter((v) => !isNil(v))
    .join(formatLogic('or'))})`;
};

const authors = ({ author, logic_author }: ClassicFormParams) => {
  if (isNil(author)) {
    return;
  }
  // wrap author names containing special characters with quotes
  return `author:(${author.map((v) => (/[\W]+/.test(v) ? `"${v}"` : v)).join(formatLogic(logic_author))})`;
};

const objects = ({ object, logic_object }: ClassicFormParams) => {
  if (isNil(object)) {
    return;
  }
  return object.join(formatLogic(logic_object));
};

const bibstems = ({ bibstems }: ClassicFormParams) => {
  if (isNil(bibstems)) {
    return;
  }
  return `bibstem:(${bibstems.join(formatLogic('or'))})`;
};

const abstracts = ({ abstract_keywords, logic_abstract }: ClassicFormParams) => {
  if (isNil(abstract_keywords)) {
    return;
  }
  return `abs:(${abstract_keywords.join(formatLogic(logic_abstract))})`;
};

const title = ({ title, logic_title }: ClassicFormParams) => {
  if (isNil(title)) {
    return;
  }
  return `title:(${title.join(formatLogic(logic_title))})`;
};

const pubdate = ({ pubdate_start, pubdate_end }: ClassicFormParams) => {
  if (isNil(pubdate_start) || isNil(pubdate_end)) {
    return;
  }
  const [yearFrom, monthFrom] = pubdate_start;
  const [yearTo, monthTo] = pubdate_end;

  return `pubdate:[${yearFrom}${monthFrom ? `-${monthFrom}` : ''} TO ${yearTo}${monthTo ? `-${monthTo}` : ''}]`;
};

const buildQuery = (params: ClassicFormParams) => {
  const query = [
    collections(params),
    authors(params),
    bibstems(params),
    abstracts(params),
    objects(params),
    title(params),
    pubdate(params),
  ]
    .filter((v) => !isNil(v))
    .join(' ');

  return query;
};
