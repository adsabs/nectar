import {
  getAbs,
  getAuthor,
  getBibstems,
  getLimit,
  getObject,
  getProperty,
  getPubdate,
  getSearchQuery,
  getTitle,
} from '../helpers';
import { CollectionChoice, IRawClassicFormState, LogicChoice, PropertyChoice } from '../types';
import { describe, expect, test } from 'vitest';

describe('Classic Form Query Handling', () => {
  // Collections
  test.concurrent.each<[CollectionChoice[], string]>([
    [[], ''],
    [['astronomy'], 'collection:(astronomy)'],
    [['astronomy', 'physics'], 'collection:(astronomy physics)'],
    [['astronomy', 'physics', 'general'], 'collection:(astronomy physics general)'],
  ])('getLimit(%s) -> %s', (choice, expected) => expect(getLimit(choice)).toBe(expected));

  // author
  test.concurrent.each<[string, LogicChoice, string]>([
    ['', 'and', ''],
    ['foo', 'and', 'author:(foo)'],
    ['foo\nbar', 'and', 'author:(foo bar)'],
    ['foo, b\nbar, a\nbaz, b', 'and', 'author:("foo, b" "bar, a" "baz, b")'],
    ['foo\nbar\nbaz', 'or', 'author:(foo OR bar OR baz)'],
    ['foo\nbar\nbaz', 'boolean', 'author:(foo bar baz)'],
    ['foo\nbar\n-baz', 'boolean', 'author:(foo bar -baz)'],
    ['foo\n=bar\n-baz', 'boolean', 'author:(foo =bar -baz)'],
    ['foo\n=bar\n-baz', 'and', 'author:(foo =bar -baz)'],
    ['foo$', 'and', 'author:(foo) author_count:1'],
    ['foo$', 'or', 'author:(foo) author_count:1'],
    ['foo$\nbar\n-baz', 'boolean', 'author:(foo bar -baz) author_count:1'],
    ['=foo$', 'and', 'author:(=foo) author_count:1'],
    ['foo\nbar$\nbaz', 'and', 'author:(foo bar baz) author_count:1'],
    ['^foo\n^bar\nbaz', 'and', 'author:(baz) first_author:(foo bar)'],
    ['^foo, a\n^foo, b\nbaz', 'and', 'author:(baz) first_author:("foo, a" "foo, b")'],
    ['^foo, a\n^foo, b$\nbaz', 'and', 'author:(baz) first_author:("foo, a" "foo, b") author_count:1'],
    ['    foo     \n   baz   \n  ^baz  ', 'and', 'author:(foo baz) first_author:(baz)'],
    ['-foo', 'and', 'author:(-foo)'],
    ['foo\n-bar\n=baz', 'and', 'author:(foo -bar =baz)'],
    ['foo@bar.com', 'and', 'author:("foo@bar.com")'],
    ['foo bar', 'and', 'author:("foo bar")'],
    ['foo-bar', 'and', 'author:("foo-bar")'],
  ])('getAuthor(%s, %s) -> %s', (author, logic, expected) => expect(getAuthor(author, logic)).toBe(expected));

  // object
  test.concurrent.each<[string, LogicChoice, string]>([
    ['', 'and', ''],
    ['foo', 'and', 'object:(foo)'],
    ['foo\nbar', 'and', 'object:(foo bar)'],
    ['foo fax\nbar biz\n-baz foo', 'and', 'object:("foo fax" "bar biz") -object:("baz foo")'],
    ['foo\nbar\nbaz', 'or', 'object:(foo OR bar OR baz)'],
    ['-foo\nfoo\n-bar\n-baz\nbar a\nbaz', 'or', 'object:(foo OR "bar a" OR baz) -object:(foo OR bar OR baz)'],
  ])('getObject(%s, %s) -> %s', (object, logic, expected) => expect(getObject(object, logic)).toBe(expected));

  // pubdate
  const defaultDate = 'pubdate:[0000-01 TO 9999-12]';
  test.concurrent.each<[string, string, string]>([
    ['', '', ''],
    ['1200/03', '2000/02', 'pubdate:[1200-03 TO 2000-02]'],
    ['99999999', '2000/02', 'pubdate:[9999-01 TO 2000-02]'],
    ['', '-1/02', 'pubdate:[0000-01 TO 9999-12]'],
    ['/', '/', 'pubdate:[0000-01 TO 9999-12]'],
    ['1200', '2000/02', 'pubdate:[1200-01 TO 2000-02]'],
    ['', '2000/02', 'pubdate:[0000-01 TO 2000-02]'],
    ['foo', '', defaultDate],
    ['', 'foo', defaultDate],
    ['2000', 'foo', 'pubdate:[2000-01 TO 9999-12]'],
    ['foo', '2000', 'pubdate:[0000-01 TO 2000-12]'],
  ])(`getPubdate(%s, %s) -> %s`, (start, end, expected) => expect(getPubdate(start, end)).toBe(expected));

  // title
  test.concurrent.each<[string, LogicChoice, string]>([
    ['', 'or', ''],
    ['foo', 'or', 'title:(foo)'],
    ['foo bar', 'or', 'title:(foo OR bar)'],
    ['foo bar baz', 'or', 'title:(foo OR bar OR baz)'],
    ['foo bar baz', 'and', 'title:(foo bar baz)'],
    ['foo bar baz', 'boolean', 'title:(foo bar baz)'],
    ['foo bar "baz baz"', 'boolean', 'title:(foo bar "baz baz")'],
    ['-foo -bar -"bar baz" boo', 'and', 'title:(-foo -bar -"bar baz" boo)'],
    ['=foo', 'and', 'title:(=foo)'],
  ])('getTitle(%s, %s) -> %s', (query, logic, expected) => expect(getTitle(query, logic)).toBe(expected));

  // abstract
  test.concurrent.each<[string, LogicChoice, string]>([
    ['', 'or', ''],
    ['foo', 'or', 'abs:(foo)'],
    ['foo bar', 'or', 'abs:(foo OR bar)'],
    ['foo bar baz', 'or', 'abs:(foo OR bar OR baz)'],
    ['foo bar baz', 'and', 'abs:(foo bar baz)'],
    ['foo bar baz', 'boolean', 'abs:(foo bar baz)'],
    ['foo bar "baz baz"', 'boolean', 'abs:(foo bar "baz baz")'],
  ])('getAbs(%s, %s) -> %s', (query, logic, expected) => expect(getAbs(query, logic)).toBe(expected));

  // property
  test.concurrent.each<[PropertyChoice[], string]>([
    [[], ''],
    [['refereed-only'], 'property:(refereed)'],
    [['articles-only'], 'property:(article)'],
    [['refereed-only', 'articles-only'], 'property:(refereed article)'],
  ])(`getProperty(%s) -> %s`, (choices, expected) => expect(getProperty(choices)).toBe(expected));

  // bibstems
  test.concurrent.each<[string, string]>([
    ['', ''],
    ['PhRvL', 'bibstem:(PhRvL)'],
    ['PhRvL,ApJ', 'bibstem:(PhRvL OR ApJ)'],
    ['PhRvL,ApJ,ApJL', 'bibstem:(PhRvL OR ApJ OR ApJL)'],
    ['PhRvL,-ApJ', 'bibstem:(PhRvL) -bibstem:(ApJ)'],
    ['PhRvL,ApJ,-ApJL', 'bibstem:(PhRvL OR ApJ) -bibstem:(ApJL)'],
    ['PhRvL,-ApJ,-ApJL', 'bibstem:(PhRvL) -bibstem:(ApJ OR ApJL)'],
    ['PhRvL,ApJ,-ApJL', 'bibstem:(PhRvL OR ApJ) -bibstem:(ApJL)'],
    ['PhRvL,ApJ,ApJL,-ApJL', 'bibstem:(PhRvL OR ApJ OR ApJL) -bibstem:(ApJL)'],
  ])(`getBibstems(%s) -> %s`, (bibstems, expected) => expect(getBibstems(bibstems)).toBe(expected));

  test('getSearchQuery handles empty input', () => {
    expect(getSearchQuery({} as IRawClassicFormState)).toBe('q=%2A%3A%2A&sort=score+desc&sort=date+desc&p=1');
  });

  test('getSearchQuery properly generates search query', () => {
    const state: IRawClassicFormState = {
      limit: ['astronomy', 'physics'],
      author: 'Smith, A\nJones, B\n=Jones, Bob',
      logic_author: 'and',
      object: 'IRAS\nHIP',
      logic_object: 'and',
      pubdate_start: '2020/12',
      pubdate_end: '2022/01',
      title: '"Black Hole" -"Milky Way" -star',
      logic_title: 'and',
      abstract_keywords: '"Event Horizon" Singularity',
      logic_abstract_keywords: 'and',
      property: ['refereed-only', 'articles-only'],
      bibstems: 'PhRvL,-Apj',
      sort: ['score desc', 'date desc'],
    };
    const result = new URLSearchParams(getSearchQuery(state));
    expect(result.get('q')).toBe(
      `collection:(astronomy physics) pubdate:[2020-12 TO 2022-01] author:("Smith, A" "Jones, B" ="Jones, Bob") object:(IRAS HIP) property:(refereed article) title:("Black Hole" -"Milky Way" -star) abs:("Event Horizon" Singularity) bibstem:(PhRvL) -bibstem:(Apj)`,
    );
    expect(result.getAll('sort')).toStrictEqual(['score desc', 'date desc']);
  });
});
