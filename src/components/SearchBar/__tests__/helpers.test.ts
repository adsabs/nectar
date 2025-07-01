import { splitSearchTerms, wrapSelectedWithField } from '../helpers';
import { describe, expect, test } from 'vitest';

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
