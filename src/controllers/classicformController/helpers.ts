import DOMPurify from 'isomorphic-dompurify';
import { head, isNil, pipe } from 'ramda';
import { ClassicFormParams, LogicAll, LogicAndOr } from './types';

const dateSanitizer = (value: string): [number, number] | undefined => {
  if (value.length === 0) {
    return undefined;
  }
  try {
    const parts = value.split('/');
    const year = Math.min(Math.max(parseInt(parts[0]), 0), 9999);
    const month = Math.min(Math.max(parseInt(parts[1]), 1), 12);
    if (year === 9999) {
      return undefined;
    }
    return [year, month];
  } catch (e) {
    return undefined;
  }
};

const escape = (val?: string): string => (typeof val === 'string' ? DOMPurify.sanitize(val) : '');
const listSanitizer = (v: string): string[] =>
  v.length > 0 ? (Array.from(v.matchAll(/[^\r\n]+/g), head) as string[]) : [];
const delimSanitizer = (v: string): string[] => (v.length > 0 ? v.split(/[^\w]+/) : []);
const formatLogic = (logic: LogicAll | LogicAndOr): string => (logic === 'or' ? 'OR' : ' ');
const emptyOrUndefined = (val?: string | string[]): val is '' | [] => {
  return typeof val === 'string' || Array.isArray(val) ? (val.length > 0 ? false : true) : true;
};

export const checks = {
  logicAndOrCheck(val: string): LogicAndOr {
    return ['and', 'or'].includes(val) ? (val as LogicAndOr) : 'and';
  },
  logicAllCheck(val: string): LogicAll {
    return ['and', 'or', 'boolean'].includes(val) ? (val as LogicAll) : 'and';
  },
  binaryCheck(val?: string): boolean {
    return typeof val === 'string';
  },
  listCheck: pipe<string, string, string[]>(escape, listSanitizer),
  dateCheck: pipe<string, string, [number, number] | undefined>(escape, dateSanitizer),
  delimCheck: pipe<string, string, string[]>(escape, delimSanitizer),
};

export const stringifiers = {
  collections({ limit_astronomy, limit_general, limit_physics }: ClassicFormParams): string | undefined {
    if (!limit_astronomy && !limit_general && !limit_physics) {
      return undefined;
    }
    return `collection:(${[
      limit_astronomy ? 'astronomy' : null,
      limit_physics ? 'physics' : null,
      limit_general ? 'general' : null,
    ]
      .filter((v) => !isNil(v))
      .join(formatLogic('or'))})`;
  },

  authors({ author, logic_author }: ClassicFormParams): string | undefined {
    if (emptyOrUndefined(author)) {
      return;
    }
    // wrap author names containing special characters with quotes
    return `author:(${author.map((v: string) => (/[\W]+/.test(v) ? `"${v}"` : v)).join(formatLogic(logic_author))})`;
  },

  objects({ object, logic_object }: ClassicFormParams): string | undefined {
    if (emptyOrUndefined(object)) {
      return;
    }
    return object.join(formatLogic(logic_object));
  },

  bibstems({ bibstems }: ClassicFormParams): string | undefined {
    if (emptyOrUndefined(bibstems)) {
      return;
    }
    return `bibstem:(${bibstems.join(formatLogic('or'))})`;
  },

  abstracts({ abstract_keywords, logic_abstract_keywords }: ClassicFormParams): string | undefined {
    if (emptyOrUndefined(abstract_keywords)) {
      return;
    }
    return `abs:(${abstract_keywords.join(formatLogic(logic_abstract_keywords))})`;
  },

  title({ title, logic_title }: ClassicFormParams): string | undefined {
    if (emptyOrUndefined(title)) {
      return;
    }
    return `title:(${title.join(formatLogic(logic_title))})`;
  },

  pubdate({ pubdate_start, pubdate_end }: ClassicFormParams): string | undefined {
    if (isNil(pubdate_start) || isNil(pubdate_end)) {
      return;
    }
    const [yearFrom, monthFrom] = pubdate_start;
    const [yearTo, monthTo] = pubdate_end;

    return `pubdate:[${yearFrom}${monthFrom ? `-${monthFrom}` : ''} TO ${yearTo}${monthTo ? `-${monthTo}` : ''}]`;
  },
};
