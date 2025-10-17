import {
  appendSearchTerm,
  extractFinalTerm,
  filterItems,
  getCursorPosition,
  getFocusedItemValue,
  getPreview,
  splitSearchTerms,
  updateSearchTerm,
  updateUATSearchTerm,
  updateJournalSearchTerm,
  wrapSelectedWithField,
} from '../helpers';
import { describe, expect, test } from 'vitest';
import { TypeaheadOption } from '@/components/SearchBar/types';

describe('wrapSelectedWithField', () => {
  const testCases: [string, Parameters<typeof wrapSelectedWithField>, string][] = [
    // Replacing selected text
    ['Replace with field:', ['test foo bar', 5, 8, 'author:'], 'test author:foo bar'],
    ['Replace with field:()', ['x y z', 2, 3, 'tag:()'], 'x tag:(y) z'],
    ['Replace with field:""', ['before middle after', 7, 13, 'field:""'], 'before field:"middle" after'],

    // No selection → append
    ['Append field:"" to end', ['foo bar', 7, 7, 'author:""'], 'foo bar author:""'],
    ['Append field:() to end', ['abc def', 0, 0, 'tag:()'], 'abc def tag:()'],
    ['Append field: to end', ['one two', 4, 4, 'field:'], 'one two field:'],
    ['Append invalid to end', ['stuff', 0, 0, 'notAField'], 'stuff notAField'],
    ['Append with empty input', ['', 0, 0, 'x:()'], 'x:()'],

    // Replace full input
    ['Replace full input', ['foo', 0, 3, 'bar:""'], 'bar:"foo"'],

    // Edge cases
    ['Empty selection, weird field', ['text here', 0, 0, 'strange:[]'], 'text here strange:[]'],
    ['Selection with space', ['a b c', 4, 5, 'wrap:()'], 'a b wrap:(c)'],
    ['Selection is trimmed', ['a b     c', 4, 9, 'wrap:()'], 'a b wrap:(c)'],
    ['Template has text in field', ['start middle end', 0, 5, 'field:"test"'], 'start middle end field:"test"'],
    ['Double quotes', ['abc def', 4, 7, '""'], 'abc "def"'],
    ['Double quotes + star', ['abc def', 4, 7, '""*'], 'abc "def"*'],
    ['Equals + double quotes', ['abc def', 4, 7, '=""'], 'abc ="def"'],
    ['Equals + double quotes with no selection', ['abc def', 7, 7, '=""'], 'abc def =""'],
    ['Quotes with question mark', ['abc def', 4, 7, '""?'], 'abc "def"?'],
  ];
  test.each(testCases)('%s', (_, args, expected) => {
    expect(wrapSelectedWithField(...args)).toBe(expected);
  });
});

describe('splitSearchTerms', () => {
  const testCases: [string, string, string[]][] = [
    ['Simple space-separated words', 'foo bar baz', ['foo', 'bar', 'baz']],
    ['Quoted value with space', 'title:"Dark Matter" galaxy', ['title:"Dark Matter"', 'galaxy']],
    ['Parentheses with space inside', 'author:(Einstein Newton) year:1920', ['author:(Einstein Newton)', 'year:1920']],
    ['Nested quote in parens', 'tag:(quantum "dark energy")', ['tag:(quantum "dark energy")']],
    ['Unquoted key:value term', 'bibcode:2023AJ....123A', ['bibcode:2023AJ....123A']],
    ['Trailing space', 'foo bar ', ['foo', 'bar']],
    ['Multiple spaces between words', 'foo     bar   baz', ['foo', 'bar', 'baz']],
    ['Empty string', '', []],
    ['Only quoted phrase', '"just a quote"', ['"just a quote"']],
    ['Only parenthesized phrase', '(just in parens)', ['(just in parens)']],
    ['Colon inside quotes, no field', '"field:value" regular', ['"field:value"', 'regular']],
    ['Empty parens and quotes are preserved', 'x:() y:""', ['x:()', 'y:""']],

    // TODO: this will require more complex logic than the basic regex currently used, and for now its not needed
    // ['Unbalanced quote', 'title:"open quote author:Einstein', ['title:"open quote', 'author:Einstein']],
    // ['Unbalanced parens', 'note:(unclosed author:Einstein', ['note:(unclosed', 'author:Einstein']],
    ['Weird field spacing', 'foo:   "bar baz"', ['foo:', '"bar baz"']],
    ['Only spaces', '   ', []],
    [
      'Quote inside parens and vice versa',
      'data:(x "y (z)") label:"(abc def)"',
      ['data:(x "y (z)")', 'label:"(abc def)"'],
    ],
    [
      'Combo with noise',
      'title:"Stars" author:(Carl "Sagan") field:astro end',
      ['title:"Stars"', 'author:(Carl "Sagan")', 'field:astro', 'end'],
    ],
  ];
  test.each(testCases)('%s', (_, input, expected) => {
    expect(splitSearchTerms(input)).toEqual(expected);
  });
});

describe('extractFinalTerm', () => {
  test('returns last token when input is valid', () => {
    expect(extractFinalTerm('author:(Einstein) tag:(gravity) year:1920')).toBe('year:1920');
  });

  test('returns empty string when ends in space', () => {
    expect(extractFinalTerm('foo bar ')).toBe('');
  });

  test('returns empty string when ends in colon', () => {
    expect(extractFinalTerm('author:')).toBe('');
  });

  test('handles malformed input gracefully', () => {
    expect(extractFinalTerm('title:"Unclosed quote')).toBe('quote');
  });
});

describe('updateSearchTerm', () => {
  test('replaces final word with new value', () => {
    expect(updateSearchTerm('foo bar', 'baz')).toBe('foo baz');
  });

  test('returns value when input is empty', () => {
    expect(updateSearchTerm('', 'baz')).toBe('baz');
  });
});

describe('updateUATSearchTerm', () => {
  test('replaces uat:"..." pattern with uat:value', () => {
    expect(updateUATSearchTerm('author:"foo" uat:"old"', '"new"')).toBe('author:"foo" uat:"new"');
  });

  test('handles bare uat string', () => {
    expect(updateUATSearchTerm('uat:"thing"', '"new"')).toBe('uat:"new"');
  });

  test('adds prefix if input is empty', () => {
    expect(updateUATSearchTerm('', '"new"')).toBe('"new"');
  });

  test('handles multi-word UAT terms with spaces', () => {
    expect(updateUATSearchTerm('author:"foo" uat:"old term"', '"main sequence"')).toBe(
      'author:"foo" uat:"main sequence"',
    );
  });

  test('handles UAT terms with spaces at start of query', () => {
    expect(updateUATSearchTerm('uat:"stellar evolution"', '"main sequence stars"')).toBe('uat:"main sequence stars"');
  });

  test('preserves other fields when replacing UAT term with spaces', () => {
    // UAT replacement, like journal replacement, puts the new term at the end after removing the old one
    expect(updateUATSearchTerm('title:"test" uat:"old value" year:2023', '"new multi word"')).toBe(
      'title:"test" year:2023 uat:"new multi word"',
    );
  });
});

describe('updateJournalSearchTerm', () => {
  test('replaces pub:"..." pattern with pub:value', () => {
    expect(updateJournalSearchTerm('author:"foo" pub:"old"', '"new"')).toBe('author:"foo" pub:"new"');
  });

  test('handles bare pub string', () => {
    expect(updateJournalSearchTerm('pub:"thing"', '"new"')).toBe('pub:"new"');
  });

  test('replaces bibstem:"..." pattern with bibstem:value', () => {
    expect(updateJournalSearchTerm('author:"foo" bibstem:"old"', '"new"')).toBe('author:"foo" bibstem:"new"');
  });

  test('handles bare bibstem string', () => {
    expect(updateJournalSearchTerm('bibstem:"ApJ"', '"new"')).toBe('bibstem:"new"');
  });

  test('replaces pub_abbrev:"..." pattern with pub_abbrev:value', () => {
    expect(updateJournalSearchTerm('pub_abbrev:"old"', '"new"')).toBe('pub_abbrev:"new"');
  });

  test('preserves original field type', () => {
    expect(updateJournalSearchTerm('BIBSTEM:"old"', '"new"')).toBe('bibstem:"new"');
  });

  test('adds prefix if input is empty', () => {
    expect(updateJournalSearchTerm('', '"new"')).toBe('"new"');
  });

  test('returns value if no journal field found', () => {
    expect(updateJournalSearchTerm('author:"foo" title:"bar"', '"new"')).toBe('"new"');
  });

  test('preserves original field type when multiple journal fields exist', () => {
    // This tests the specific bug: typing pub:"Astro and having it change to bibstem: when selecting
    expect(updateJournalSearchTerm('bibstem:"ApJ" pub:"Astro"', '"Astronomy"')).toBe('bibstem:"ApJ" pub:"Astronomy"');
  });

  test('handles incomplete pub field without changing to other field types', () => {
    // Simulates typing pub:"Astro (without closing quote) and selecting a suggestion
    expect(updateJournalSearchTerm('pub:"Astro', '"Astronomy"')).toBe('pub:"Astronomy"');
  });
});

describe('appendSearchTerm', () => {
  test('appends space + value if input is non-empty', () => {
    expect(appendSearchTerm('foo', 'bar')).toBe('foo bar');
  });

  test('returns value if input is empty', () => {
    expect(appendSearchTerm('', 'bar')).toBe('bar');
  });
});

describe('getCursorPosition', () => {
  test('returns length - 1 for closing quote/pair patterns', () => {
    expect(getCursorPosition('field:""')).toBe('field:"'.length);
    expect(getCursorPosition('title()')).toBe('title('.length);
    expect(getCursorPosition('tags[]')).toBe('tags['.length);
    expect(getCursorPosition('name:"^"')).toBe('name:"^'.length);
  });

  test('returns length - 2 for ""? or ""*', () => {
    // Length: 7 → cursor at 5
    expect(getCursorPosition('foo""?')).toBe('foo"'.length);
    expect(getCursorPosition('bar""*')).toBe('bar"'.length);
  });

  test('returns length if nothing special', () => {
    expect(getCursorPosition('simple')).toBe(6);
    expect(getCursorPosition('title:"foo"')).toBe(11);
  });
});

const exampleItem: TypeaheadOption = { value: 'similar()', label: 'Similar', desc: '', id: 1, match: [] };

describe('getFocusedItemValue', () => {
  test('returns null when focused index is invalid', () => {
    expect(getFocusedItemValue([exampleItem], -1)).toBe(null);
    expect(getFocusedItemValue([exampleItem], 5)).toBe(null);
  });

  test('returns item value when focused is valid', () => {
    expect(getFocusedItemValue([exampleItem, { ...exampleItem, value: 'y' }], 1)).toBe('y');
  });
});

describe('getPreview', () => {
  test('returns original searchTerm if value is null', () => {
    expect(getPreview('foo', null)).toBe('foo');
  });

  test('returns updated term if value is present', () => {
    expect(getPreview('foo bar', 'baz')).toBe('foo baz');
  });
});

describe('filterItems', () => {
  test('returns [] if input ends in space', () => {
    expect(filterItems('foo ', [{ ...exampleItem, value: 'x', match: ['foo'] }])).toEqual([]);
  });

  test('filters items using matchSorter on term', () => {
    const items = [
      { ...exampleItem, value: 'a', match: ['gravity'] },
      { ...exampleItem, value: 'b', match: ['galaxy'] },
    ];
    expect(filterItems('gra', items)).toEqual([items[0]]);
  });
});
