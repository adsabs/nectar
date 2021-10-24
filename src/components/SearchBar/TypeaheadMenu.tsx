import clsx from 'clsx';
import { ControllerStateAndHelpers } from 'downshift';
import { matchSorter } from 'match-sorter';
import { last } from 'ramda';
import { ReactElement, useMemo } from 'react';
import { typeaheadOptions } from './models';
import { TypeaheadOption } from './types';

export const TypeaheadMenu = (props: ControllerStateAndHelpers<TypeaheadOption>): ReactElement => {
  const { getItemProps, getMenuProps, isOpen, inputValue, highlightedIndex, selectedItem } = props;

  const renderItem = (item: TypeaheadOption, index: number): ReactElement => {
    const itemCls = clsx(
      {
        'bg-gray-300': selectedItem === item,
        'font-bold bg-gray-100': highlightedIndex === index,
      },
      'px-1 py-0.5 cursor-pointer',
    );

    return (
      <li
        {...getItemProps({
          key: item.value + index.toString(),
          index,
          item,
        })}
        className={itemCls}
        data-testid="searchbar-suggestion-item"
      >
        <span className="flex space-x-1">
          <div>{item.label}</div>
          <div>({item.value})</div>
        </span>
      </li>
    );
  };

  const options = useMemo(() => filterOptions(inputValue), [inputValue, filterOptions]);
  const renderList = () => {
    return options.length > 0 ? (
      <div className="absolute left-1 mt-1 w-full bg-white rounded-b-sm focus:outline-none shadow-md divide-gray-100 divide-y-2 origin-top-right ring-1 ring-black ring-opacity-5">
        {options.map(renderItem)}
      </div>
    ) : null;
  };

  return (
    <div className="relative">
      <ul {...getMenuProps()} data-testid="searchbar-suggestion-menu">
        {isOpen ? renderList() : null}
      </ul>
    </div>
  );
};

/**
 * Takes raw input value and returns a set of filtered results
 * @param {string} rawValue raw input value
 * @returns {TypeaheadOption[]} set of filtered results
 */
const filterOptions = (rawValue: string): TypeaheadOption[] => {
  if (/\s+$/.exec(rawValue)) {
    return [];
  }
  const fields = rawValue.match(/(?:[^\s"]+|"[^"]*")+/g);
  const value = fields === null ? rawValue : last(fields);

  return matchSorter(typeaheadOptions, value, { keys: ['match'] });
};
