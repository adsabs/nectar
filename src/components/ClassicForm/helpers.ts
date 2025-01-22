import DOMPurify from 'isomorphic-dompurify';
import {
  __,
  adjust,
  all,
  allPass,
  always,
  append,
  apply,
  both,
  clamp,
  cond,
  curry,
  defaultTo,
  equals,
  identity,
  ifElse,
  includes,
  is,
  isEmpty,
  join,
  length,
  lt,
  map,
  partition,
  pipe,
  propEq,
  reject,
  replace,
  split,
  splitAt,
  startsWith,
  T,
  tail,
  test,
  toString,
  trim,
  unless,
  when,
} from 'ramda';
import { isNilOrEmpty, isNotEmpty } from 'ramda-adjunct';
import { CollectionChoice, IClassicFormState, IRawClassicFormState, LogicChoice, PropertyChoice } from './types';
import { getTerms } from '@/query';
import { APP_DEFAULTS } from '@/config';
import { makeSearchParams } from '@/utils/common/search';

const DEFAULT_PREFIXES = ['-', '+', '='];
const NOT_PREFIX = ['-'];

const isString = is(String);
const string2Num = (v: string) => Number.parseInt(v, 10);
const emptyStr = always('');
const logicJoin = (logic: LogicChoice) => pipe(join(logic === 'or' ? ' OR ' : ' '), trim);
const wrapWithField = curry((field: string, value: string) => `${field}:(${value})`);
const notWrapWithField = curry((field: string, value: string) => `-${wrapWithField(field, value)}`);
const quoteWrap = curry((prefix: string, v: string) => `${prefix}${quoteTerm(v)}`);
const splitList = pipe(split(/[\r\n]/g), map(trim));
const joinItemsWithLogic = (logic: LogicChoice) => pipe(getLogic, logicJoin)(logic);
const quoteTerm = (term: string) => (/[^A-z]/.test(term) ? `"${term}"` : term);
const hasPrefix = (prefix: Array<string>) => test(new RegExp(`^[${prefix.join('')}]`));
const parsePrefixesAndWrapItems = map(
  ifElse(hasPrefix(DEFAULT_PREFIXES), pipe(splitAt(1), apply(quoteWrap)), quoteWrap('')),
);

/**
 * Parse, clean and format pubdate start and end.
 * Will parse `yyyy` or `yyyy/mm` formats otherwise a default start/end will be used
 *
 * @example
 * getPubDate('2020', '2000/12') // pubdate:[2020-01 TO 2000-12]
 */
export const getPubdate = (startDate: string, endDate: string) => {
  const padLeft = (size: number, str: string) => (val: string) => val.padStart(size, str);
  const isPubDate = allPass([isString, test(/^(\d+\/?.*|\d+\/\d+)$/)]);
  const defaultDate = (isTo: boolean) => always(isTo ? ['9999', '12'] : ['0000', '01']);
  const joinAndWrap = (v: string[]) => `pubdate:[${v.join(' TO ')}]`;

  // clamp/pad year
  const formatYear = (isTo: boolean) =>
    pipe(string2Num, defaultTo(isTo ? 9999 : 0), clamp(0, 9999), toString, padLeft(4, isTo ? '9' : '0'));

  // clamp/pad month
  const formatMonth = (isTo: boolean) =>
    pipe(string2Num, defaultTo(isTo ? 12 : 1), clamp(1, 12), toString, padLeft(2, '0'));

  const parsePubDate = (isTo: boolean) =>
    ifElse(
      // check if is valid pubdate
      isPubDate,

      // if so, split and process
      pipe<[string], string[], string[], string[], string[]>(
        split('/'),
        // makes sure that we have an array of length 2 (appends if necessary)
        when<string[], string[]>(propEq('length', 1), append(isTo ? '12' : '01')),

        // update year and month, clamping and padding
        adjust(0, formatYear(isTo)),
        adjust(1, formatMonth(isTo)),
      ),

      // if not valid pubdate, return a default value
      defaultDate(isTo),
    );

  const parseStartDate = parsePubDate(false);
  const parseEndDate = parsePubDate(true);

  return ifElse(
    // if both start and end are empty, return ''
    all(isEmpty),
    emptyStr,

    // map over dates, rejecting empties and doing final formatting
    pipe<[string[]], string[][], string[][], string[], string>(
      ([from, to]) => [parseStartDate(from), parseEndDate(to)],
      reject(isEmpty),
      map(join('-')),
      joinAndWrap,
    ),
  )([startDate, endDate]);
};

/**
 * Validates, parses and returns search string for limiting collections
 *
 * @example
 * getLimit(['astronomy', 'physics']); // collection:(astronomy OR physics)
 */
export const getLimit = (limit: CollectionChoice[]) => {
  const limits = ['astronomy', 'physics', 'general', 'earthscience'];
  const isLimit = (limit: string): limit is CollectionChoice => allPass([isString, includes(__, limits)])(limit);
  const limitIsValid = both(isNotEmpty, all(isLimit));

  return ifElse(limitIsValid, pipe(logicJoin('and'), wrapWithField('collection')), always(''))(limit);
};

/**
 * Validate logic choice and guarantee a proper logic value as string
 *
 * @example
 * getLogic('or'); // 'or'
 * getLogic('foo'); // 'and'
 */
export const getLogic = (logic: LogicChoice): LogicChoice => {
  const logics = ['and', 'or', 'boolean'];
  const isLogic = (logic: LogicChoice): logic is LogicChoice => allPass([isString, includes(__, logics)])(logic);

  return unless<LogicChoice, LogicChoice>(isLogic, always('and'))(logic);
};

/**
 * Validate and parse author list
 *
 * @example
 * getAuthor('foo/nbar', 'and'); // author:("foo" "bar")
 * getAuthor('-foo/nbar', 'or'); // author:(-"foo" OR "bar")
 * getAuthor('foo$', 'and'); // author:"foo" author_count:1
 * getAuthor('^foo', 'and'); // first_author:("foo") author_count:1
 */
export const getAuthor = (author: string, logic: LogicChoice) => {
  const parseAndFormat = (list: Array<string>): string => {
    const [firstAuthors, otherAuthors] = partition(startsWith('^'), list);
    const firstAuthorResult = isEmpty(firstAuthors)
      ? undefined
      : pipe(
          map(replace(/^\^/, '')),
          parsePrefixesAndWrapItems,
          joinItemsWithLogic(logic),
          wrapWithField('first_author'),
        )(firstAuthors);

    const otherAuthorResult = isEmpty(otherAuthors)
      ? undefined
      : pipe(parsePrefixesAndWrapItems, joinItemsWithLogic(logic), wrapWithField('author'))(otherAuthors);

    if (!firstAuthorResult && typeof otherAuthorResult === 'string') {
      return otherAuthorResult;
    }
    if (!otherAuthorResult && typeof firstAuthorResult === 'string') {
      return firstAuthorResult;
    }
    return [otherAuthorResult, firstAuthorResult].join(' ');
  };

  return unless(
    isNilOrEmpty,
    pipe(
      trim,
      ifElse(
        includes('$'),

        // single-author search, remove $, force OR logic, and append author_count:1
        pipe(
          replace(/\$/g, ''),
          splitList,
          reject(isEmpty),
          ifElse(
            isEmpty,
            emptyStr,
            pipe(parseAndFormat, (v: string) => `${v} author_count:1`),
          ),
        ),

        // not single-author search, parse prefixes and wrap items
        pipe(splitList, reject(isEmpty), parseAndFormat),
      ),
    ),
  )(author);
};

/**
 * Parse object list
 *
 * @example
 * getObject('foo/nbar', 'and'); // object:("foo" "bar")
 */
export const getObject = (object: string, logic: LogicChoice): string => {
  const terms = pipe(trim, splitList, reject(isEmpty))(object);
  if (isEmpty(terms)) {
    return '';
  }

  const noPrefixTerms: string[] = [];
  const prefixedTerms: string[] = [];
  terms.forEach((term) =>
    hasPrefix(NOT_PREFIX)(term) ? prefixedTerms.push(quoteTerm(tail(term))) : noPrefixTerms.push(quoteTerm(term)),
  );

  return joinItemsWithLogic('and')([
    unless(isEmpty, pipe(joinItemsWithLogic(logic), wrapWithField('object')))(noPrefixTerms),
    unless(isEmpty, pipe(joinItemsWithLogic(logic), notWrapWithField('object')))(prefixedTerms),
  ]);
};

/**
 * Parse array of property choices
 *
 * @example
 * getProperty(['refereed-only']); // property:(refereed)
 */
export const getProperty = (property: PropertyChoice[]) => {
  const convertNames = map(
    cond([
      [equals('refereed-only'), always('refereed')],
      [equals('articles-only'), always('article')],
      [T, identity],
    ]),
  );
  const properties = ['refereed-only', 'articles-only'];
  const isProperty = (property: string): property is PropertyChoice =>
    allPass([isString, includes(__, properties)])(property);
  const isValidListOfProperties = both(pipe(length, lt(0)), all(isProperty));

  return ifElse(
    isValidListOfProperties,
    pipe(convertNames, logicJoin('and'), wrapWithField('property')),
    emptyStr,
  )(property);
};

/**
 * Parse title strings
 *
 * @example
 * getTitle('foo bar baz', 'or'); // title:(foo OR bar OR baz)
 */
export const getTitle = (title: string, logic: LogicChoice) =>
  unless(isEmpty, pipe(trim, getTerms, logicJoin(getLogic(logic)), wrapWithField('title')))(title);

/**
 * Parse abs strings
 *
 * @example
 * getAbs('foo bar baz', 'or'); // abs:(foo OR bar OR baz)
 */
export const getAbs = (abs: string, logic: LogicChoice) =>
  unless(isEmpty, pipe(trim, getTerms, logicJoin(getLogic(logic)), wrapWithField('abs')))(abs);

/**
 * Generate bibstem search field
 */
export const getBibstems = (bibstems: string) => {
  const terms = pipe(trim, split(','), reject(isEmpty))(bibstems);
  if (isEmpty(terms)) {
    return '';
  }

  const noPrefixTerms: string[] = [];
  const prefixedTerms: string[] = [];
  terms.forEach((term) =>
    hasPrefix(NOT_PREFIX)(term) ? prefixedTerms.push(quoteTerm(tail(term))) : noPrefixTerms.push(quoteTerm(term)),
  );

  return joinItemsWithLogic('and')([
    unless(isEmpty, pipe(joinItemsWithLogic('or'), wrapWithField('bibstem')))(noPrefixTerms),
    unless(isEmpty, pipe(joinItemsWithLogic('or'), notWrapWithField('bibstem')))(prefixedTerms),
  ]);
};

/**
 * Run classic form parameters through parsers and generate URL query string
 */
export const getSearchQuery = (params: IRawClassicFormState): string => {
  if (isEmpty(params)) {
    return makeSearchParams({ q: APP_DEFAULTS.EMPTY_QUERY });
  }

  // sanitize strings
  const purify = (v: string) => DOMPurify.sanitize(v);

  // run all params through a sanitizer
  const cleanParams = map<IRawClassicFormState, IRawClassicFormState>((param) => {
    if (typeof param === 'string') {
      return purify(param);
    }
    if (Array.isArray(param)) {
      return map(purify, param);
    }
    return param;
  }, params) as IClassicFormState;

  // gather all strings and join them with space (excepting sort)
  const query = pipe(
    reject(isEmpty),
    join(' '),
  )([
    getLimit(cleanParams.limit),
    getPubdate(cleanParams.pubdate_start, cleanParams.pubdate_end),
    getAuthor(cleanParams.author, cleanParams.logic_author),
    getObject(cleanParams.object, cleanParams.logic_object),
    getProperty(cleanParams.property),
    getTitle(cleanParams.title, cleanParams.logic_title),
    getAbs(cleanParams.abstract_keywords, cleanParams.logic_abstract_keywords),
    getBibstems(cleanParams.bibstems),
  ]);

  return makeSearchParams({
    q: query,
    sort: cleanParams.sort,
  });
};
