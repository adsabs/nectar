import { List, ListItem, Text, HStack } from '@chakra-ui/layout';
import { UseComboboxGetItemPropsOptions } from 'downshift';
import { curry } from 'ramda';
import { ReactElement, useEffect, useMemo } from 'react';
import { usePopper } from 'react-popper';
import { chainFrom } from 'transducist';
import { bibstems, ITEM_DELIMITER } from './models';
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
    <List {...attributes.popper} style={styles.popper} variant="autocomplete">
      {items.map((item, index) => {
        const [bibstem, description] = item.split(ITEM_DELIMITER);
        return (
          <ListItem
            key={`${item}${index}`}
            {...getItemProps({ item, index })}
            backgroundColor={highlightedIndex === index ? 'gray.100' : {}}
          >
            <HStack alignItems="center" spacing={1}>
              <Text fontSize="md">{bibstem}</Text>
              <Text fontSize="sm">{description}</Text>
            </HStack>
          </ListItem>
        );
      })}
    </List>
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
