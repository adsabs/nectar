import { makeSearchParams } from '@utils';
import DOMPurify from 'isomorphic-dompurify';
import {
  adjust,
  all,
  allPass,
  always,
  any,
  append,
  apply,
  both,
  clamp,
  cond,
  curry,
  defaultTo,
  equals,
  find,
  identity,
  ifElse,
  includes,
  init,
  is,
  isEmpty,
  join,
  length,
  lt,
  map,
  pipe,
  propEq,
  reject,
  split,
  splitAt,
  T,
  tail,
  test,
  toString,
  trim,
  unless,
  when,
  __,
} from 'ramda';
import { isEmptyArray, isNotEmpty, isNotNilOrEmpty } from 'ramda-adjunct';
import { CollectionChoice, IClassicFormState, IRawClassicFormState, LogicChoice, PropertyChoice } from './types';

const isString = is(String);
const string2Num = (v: string) => Number.parseInt(v, 10);
const emptyStr = always('');
const logicJoin = (logic: LogicChoice) => join(logic === 'or' ? ' OR ' : ' ');
const wrapWithField = curry((field: string, value: string) => `${field}:(${value})`);
const notWrapWithField = curry((field: string, value: string) => `-${wrapWithField(field, value)}`);
const quoteWrap = curry((prefix: string, v: string) => `${prefix}"${v}"`);
const splitList = split(/[\r\n]/g);
const joinItemsWithLogic = (logic: LogicChoice) => pipe(getLogic, logicJoin)(logic);
const splitBySpace = split(/\s+/);
const hasPrefix = test(/^-/);

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
  const limits = ['astronomy', 'physics', 'general'];
  const isLimit = (limit: string): limit is CollectionChoice => allPass([isString, includes(__, limits)])(limit);
  const defaultLimit = logicJoin('or')(limits);
  const limitIsValid = both(pipe(length, lt(0)), all(isLimit));

  return ifElse(
    limitIsValid,
    pipe(logicJoin('and'), wrapWithField('collection')),
    always(wrapWithField('collection', defaultLimit)),
  )(limit);
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
 * getAuthor('+foo/nbar', 'or'); // author:(+"foo" OR "bar")
 * getAuthor('foo$', 'and'); // author:"foo" author_count:1
 */
export const getAuthor = (author: string, logic: LogicChoice): string => {
  const hasRestrictPostfix = test(/[\$]$/);
  const hasPrefix = test(/^[=\-+]/);
  const wrap = wrapWithField('author');
  const singleAuthorSearch = (v: string) => `author:"${v}" author_count:1`;
  const parsePrefixesAndWrapItems = map(ifElse(hasPrefix, pipe(splitAt(1), apply(quoteWrap)), quoteWrap('')));

  return unless(
    isEmpty,
    pipe(
      trim,
      splitList,
      reject(isEmpty),
      ifElse(
        any(hasRestrictPostfix),
        pipe(find(hasRestrictPostfix), init, singleAuthorSearch),
        pipe(parsePrefixesAndWrapItems, joinItemsWithLogic(logic), wrap),
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
  const wrap = wrapWithField('object');
  const cleanAndWrapEntries = pipe(trim, splitList, reject(isEmpty), map(quoteWrap('')));
  return unless(isEmpty, pipe(cleanAndWrapEntries, joinItemsWithLogic(logic), wrap))(object);
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
  unless(isEmpty, pipe(trim, splitBySpace, logicJoin(getLogic(logic)), wrapWithField('title')))(title);

/**
 * Parse abs strings
 *
 * @example
 * getAbs('foo bar baz', 'or'); // abs:(foo OR bar OR baz)
 */
export const getAbs = (abs: string, logic: LogicChoice) =>
  unless(isEmpty, pipe(trim, splitBySpace, logicJoin(getLogic(logic)), wrapWithField('abs')))(abs);

/**
 * Generate bibstem search field
 */
export const getBibstems = (bibstems: string) => {
  const negList: string[] = [];
  const posList: string[] = [];

  // TODO: improve this logic
  const getResult = (value: string[], isNegated: boolean) =>
    ifElse(
      isEmptyArray,
      () => '',
      pipe(
        logicJoin(getLogic('or')),
        ifElse(() => isNegated, notWrapWithField('bibstem'), wrapWithField('bibstem')),
      ),
    )(value);

  when(
    isNotNilOrEmpty,
    pipe(
      split(','),
      map(
        ifElse(
          hasPrefix,
          (bib) => negList.push(tail(bib)),
          (bib) => posList.push(bib),
        ),
      ),
    ),
  )(bibstems);

  return [getResult(posList, false), getResult(negList, true)].filter(isNotEmpty).join(' ');
};

/**
 * Run classic form parameters through parsers and generate URL query string
 */
export const getSearchQuery = (params: IRawClassicFormState): string => {
  // sanitize strings
  const purify = (v: string) => DOMPurify.sanitize(v);

  // run all params through a sanitizer
  const cleanParams = map<IRawClassicFormState, IRawClassicFormState>(
    (v) => (typeof v === 'string' ? purify(v) : Array.isArray(v) ? map(purify, v) : v),
    params,
  ) as IClassicFormState;

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
