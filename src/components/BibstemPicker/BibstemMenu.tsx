import { UseComboboxGetItemPropsOptions } from 'downshift';
import { curry } from 'ramda';
import { ReactElement, useEffect, useMemo } from 'react';
import { usePopper } from 'react-popper';
import { chainFrom } from 'transducist';
import { bibstems } from './models';

const ITEM_DELIMITER = '$$';
export interface IBibstemMenuProps {
  onItemsChange: (items: string[]) => void;
  inputValue: string;
  selectedItems: string[];
  highlightedIndex: number;
  maxItemsToShow?: number;
  getItemProps: (options: UseComboboxGetItemPropsOptions<string>) => unknown;
}

export const BibstemMenu = (props: IBibstemMenuProps): ReactElement => {
  const { highlightedIndex, getItemProps, inputValue, selectedItems, onItemsChange, maxItemsToShow } = props;

  // partially apply the max items
  const searchBibs = useMemo(() => searchBibstems(maxItemsToShow), [maxItemsToShow]);

  // memoize the items filtering (heavy operation)
  const items = useMemo(() => searchBibs(inputValue, selectedItems), [inputValue, selectedItems]);

  useEffect(() => onItemsChange(items), [items]);

  const { attributes, styles } = usePopper();

  return (
    <ul
      {...attributes.popper}
      style={styles.popper}
      className="left-1 mt-1 w-full max-h-64 bg-white rounded-b-sm focus:outline-none shadow-md divide-gray-100 divide-y-2 overflow-y-scroll origin-top-right ring-1 ring-black ring-opacity-5"
    >
      {items.map((item, index) => {
        const [bibstem, description] = item.split(ITEM_DELIMITER);
        return (
          <div
            key={`${item}${index}`}
            {...getItemProps({ item, index })}
            style={highlightedIndex === index ? { backgroundColor: '#bde4ff' } : {}}
            className="px-1 py-0.5 cursor-pointer divide-y-0"
          >
            <div className="flex items-center space-x-3">
              <div className="text-lg">{bibstem}</div>
              <div className="text-gray-600 text-sm">{description}</div>
            </div>
          </div>
        );
      })}
    </ul>
  );
};

BibstemMenu.defaultProps = {
  inputValue: '',
  selectedItems: [],
  highlightedIndex: 0,
  maxItemsToShow: 100,
} as Partial<IBibstemMenuProps>;

/**
 * Filters the bibstems and returns a list of filtered items that start with the search string
 *
 * @param {number} maxItems max number of items to show
 * @param {string} searchString string to search bibstems
 * @param {string[]} itemsToOmit items to exclude from the search (e.g. already selected)
 * @return {*}  {string[]}
 */
const searchBibstems = curry((maxItems: number, searchString: string, itemsToOmit: string[]): string[] => {
  const formatted = searchString.toLowerCase();
  const values = chainFrom(bibstems)
    .filter((bibstem) => !itemsToOmit.includes(bibstem) && bibstem.toLowerCase().startsWith(formatted))

    // take any number of maxItems up to a max of 1000
    .take(maxItems <= 0 ? 1000 : maxItems)
    .toArray();
  return values;
});
