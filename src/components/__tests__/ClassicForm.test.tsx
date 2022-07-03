import {
  getAbs,
  getAuthor,
  getBibstems,
  getLimit,
  getObject,
  getProperty,
  getPubdate,
  getTitle,
} from '@components/ClassicForm/helpers';

describe('ClassicForm', () => {
  it('renders without crashing', () => {
    // render(<ClassicForm />);
  });
});

describe('ClassicForm Helpers', () => {
  it.concurrent.each<[Parameters<typeof getLimit>, string]>([
    [[['astronomy', 'physics', 'general']], 'collection:(astronomy physics general)'],
    [[['physics', 'general']], 'collection:(physics general)'],
    [[['astronomy', 'general']], 'collection:(astronomy general)'],
    [[['astronomy', 'physics']], 'collection:(astronomy physics)'],
    [[['astronomy']], 'collection:(astronomy)'],
    [[[]], 'collection:(astronomy OR physics OR general)'],
  ])('limit %j', (props, expected) => {
    expect(getLimit(...props)).toEqual(expected);
    return Promise.resolve();
  });

  const defaultDate = 'pubdate:[0000-01 TO 9999-12]';
  it.concurrent.each<[Parameters<typeof getPubdate>, string]>([
    [['', ''], ''],
    [['1200/03', '2000/02'], 'pubdate:[1200-03 TO 2000-02]'],
    [['99999999', '2000/02'], 'pubdate:[9999-01 TO 2000-02]'],
    [['', '-1/02'], defaultDate],
    [['/', '/'], defaultDate],
    [['1200', '2000/02'], 'pubdate:[1200-01 TO 2000-02]'],
    [['', '2000/02'], 'pubdate:[0000-01 TO 2000-02]'],
    [['foo', ''], defaultDate],
    [['', 'foo'], defaultDate],
    [['2000', 'foo'], 'pubdate:[2000-01 TO 9999-12]'],
    [['foo', '2000'], 'pubdate:[0000-01 TO 2000-12]'],
  ])('pubdate %j', (props, expected) => {
    expect(getPubdate(...props)).toEqual(expected);
    return Promise.resolve();
  });

  it.concurrent.each<[Parameters<typeof getAuthor>, string]>([
    [['foo\nfoo', 'and'], 'author:("foo" "foo")'],
    [['foo\nfoo', 'or'], 'author:("foo" OR "foo")'],
    [['', 'and'], ''],
    [['+foo', 'and'], 'author:(+"foo")'],
    [['-foo', 'and'], 'author:(-"foo")'],
    [['=foo', 'and'], 'author:(="foo")'],
    [['=foo\n-bar\n=baz', 'and'], 'author:(="foo" -"bar" ="baz")'],
    [['foo$', 'and'], 'author:"foo" author_count:1'],
    [['foo\nfoo\nfoo$\nfoo', 'and'], 'author:"foo" author_count:1'],
  ])('author %j', (props, expected) => {
    expect(getAuthor(...props)).toEqual(expected);
    return Promise.resolve();
  });

  it.concurrent.each<[Parameters<typeof getObject>, string]>([
    [['foo\nfoo', 'and'], 'object:("foo" "foo")'],
    [['foo\nfoo', 'or'], 'object:("foo" OR "foo")'],
    [['', 'and'], ''],
  ])('object %j', (props, expected) => {
    expect(getObject(...props)).toEqual(expected);
    return Promise.resolve();
  });

  it.concurrent.each<[Parameters<typeof getProperty>, string]>([
    [[['articles-only', 'refereed-only']], 'property:(article refereed)'],
    [[['articles-only']], 'property:(article)'],
    [[['refereed-only']], 'property:(refereed)'],
    [[[]], ''],
  ])('property %j', (props, expected) => {
    expect(getProperty(...props)).toEqual(expected);
    return Promise.resolve();
  });

  it.concurrent.each<[Parameters<typeof getTitle>, string]>([
    [['foo', 'and'], 'title:(foo)'],
    [['foo bar', 'and'], 'title:(foo bar)'],
    [['foo bar', 'boolean'], 'title:(foo bar)'],
    [['foo bar', 'or'], 'title:(foo OR bar)'],
  ])('title %j', (props, expected) => {
    expect(getTitle(...props)).toEqual(expected);
    return Promise.resolve();
  });

  it.concurrent.each<[Parameters<typeof getAbs>, string]>([
    [['foo', 'and'], 'abs:(foo)'],
    [['foo bar', 'and'], 'abs:(foo bar)'],
    [['foo bar', 'boolean'], 'abs:(foo bar)'],
    [['foo bar', 'or'], 'abs:(foo OR bar)'],
  ])('abs %j', (props, expected) => {
    expect(getAbs(...props)).toEqual(expected);
    return Promise.resolve();
  });

  it.concurrent.each<[Parameters<typeof getBibstems>, string]>([
    [['foo'], 'bibstem:(foo)'],
    [['foo,bar,baz'], 'bibstem:(foo OR bar OR baz)'],
  ])('bibstems %j', (props, expected) => {
    expect(getBibstems(...props)).toEqual(expected);
    return Promise.resolve();
  });
});
