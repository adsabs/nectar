import {
  createInitialSelection,
  getFormattedSelection,
  groupAffilationData,
  selectDate,
  toggle,
  toggleAff,
  toggleAll
} from '@components/AuthorAffiliations/helpers';
import { composeStories } from '@storybook/testing-react';
import { lensPath, set, mapObjIndexed, prop, view } from 'ramda';
import { describe, expect, test } from 'vitest';
import * as stories from '../__stories__/AuthorAffiliations.stories';

const { Default: AuthorAffiliations } = composeStories(stories);

// test('renders without crashing', () => {
//   render(<AuthorAffiliations />);
// });

// test('properly takes inputs', () => {
//   const {} = render(<AuthorAffiliations />);
// });

describe('helpers', () => {
  const data = [
    { authorName: 'foo', affiliations: { name: 'A', years: ['2022'], lastActiveDate: '2022/12/01' } },
    { authorName: 'foo', affiliations: { name: 'B', years: ['2021', '2022'], lastActiveDate: '2021/12/01' } },
    { authorName: 'foo', affiliations: { name: 'C', years: ['2020'], lastActiveDate: '2020/12/01' } },
    { authorName: 'foo2', affiliations: { name: '-', years: ['2022'], lastActiveDate: '2020/12/01' } },
    { authorName: 'foo2', affiliations: { name: 'D', years: ['2022'], lastActiveDate: '2022/08/01' } },
    { authorName: 'foo3', affiliations: { name: '-', years: ['2022'], lastActiveDate: '2020/04/01' } },
  ];

  test('grouping affiliation data works', () => {
    const groupedData = groupAffilationData(data);

    expect(groupedData).toEqual([
      {
        authorName: 'foo',
        affiliations: ['A', 'B', 'C'],
        years: [['2022'], ['2021', '2022'], ['2020']],
        lastActiveDate: ['2022/12/01', '2021/12/01', '2020/12/01'],
      },
      {
        authorName: 'foo2',
        affiliations: ['-', 'D'],
        years: [['2022'], ['2022']],
        lastActiveDate: ['2020/12/01', '2022/08/01'],
      },
      { authorName: 'foo3', affiliations: ['-'], years: [['2022']], lastActiveDate: ['2020/04/01'] },
    ]);
  });

  test('createInitialSelection', () => {
    const selectionState = createInitialSelection(groupAffilationData(data));
    expect(selectionState).toEqual({
      foo: {
        id: 'foo',
        selected: true,
        affSelected: [0],
        dateSelected: '2022/12/01',
      },
      foo2: {
        id: 'foo2',
        selected: true,
        affSelected: [1],
        dateSelected: '2020/12/01',
      },
      foo3: {
        id: 'foo3',
        selected: true,
        affSelected: [0],
        dateSelected: '2020/04/01',
      },
    });
  });

  const getSelected = mapObjIndexed(prop('selected'));
  const selectionState = createInitialSelection(groupAffilationData(data));

  test('toggleAll', () => {
    const pred1 = toggleAll(false, selectionState);
    expect(getSelected(pred1)).toEqual({ foo: false, foo2: false, foo3: false });

    const pred2 = toggleAll(true, pred1);
    expect(getSelected(pred2)).toEqual({ foo: true, foo2: true, foo3: true });
  });

  test('toggle', () => {
    const pred = toggle('foo', selectionState);
    expect(getSelected(pred)).toEqual({
      foo: false,
      foo2: true,
      foo3: true,
    });

    const pred2 = toggle('foo2', pred);
    expect(getSelected(pred2)).toEqual({
      foo: false,
      foo2: false,
      foo3: true,
    });
  });

  test('toggleAff', () => {
    const val = view(lensPath(['foo', 'affSelected']));

    const pred = toggleAff('foo', 2, selectionState);

    expect(val(pred)).toEqual(expect.arrayContaining([0, 2]));

    const pred2 = toggleAff('foo', 1, pred);
    expect(val(pred2)).toEqual(expect.arrayContaining([0, 1, 2]));

    const pred3 = toggleAff('foo', 2, pred2);
    expect(val(pred3)).toEqual(expect.arrayContaining([0, 1]));

    const pred4 = toggleAff('foo', 1, pred3);
    expect(val(pred4)).toEqual([0]);

    const pred5 = toggleAff('foo', 0, pred4);
    expect(val(pred5)).toEqual([]);
  });

  test('selectDate', () => {
    const val = view(lensPath(['foo2', 'dateSelected']));

    expect(val(selectionState)).toEqual('2020/12/01');

    const pred = selectDate('foo2', '2022/08/01', selectionState);
    expect(val(pred)).toEqual('2022/08/01');
  });

  test('getFormattedSelection', () => {
    expect(getFormattedSelection(groupAffilationData(data), selectionState)).toEqual([ 'foo|A|2022/12/01', 'foo2|D|2020/12/01', 'foo3|-|2020/04/01' ])

    const state = set(lensPath(['foo', 'affSelected']), [0,1,2], selectionState);

    expect(getFormattedSelection(groupAffilationData(data), state)).toEqual([
      'foo|A|2022/12/01', 
      'foo|B|2022/12/01', 
      'foo|C|2022/12/01', 
      'foo2|D|2020/12/01', 'foo3|-|2020/04/01' ])
  })
});
