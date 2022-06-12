import { HStack, List, ListItem, Text } from '@chakra-ui/layout';
import { UseComboboxGetItemPropsOptions } from 'downshift';
import { curry } from 'ramda';
import { ReactElement, useEffect, useMemo } from 'react';
import { usePopper } from 'react-popper';
import { chainFrom } from 'transducist';
import { useDebounce } from 'use-debounce';
import { bibstems } from './models';

const ITEM_DELIMITER = '$$';

export interface IBibstemMenuProps {
  onItemsChange: (items: string[]) => void;
  inputValue: string;
  selectedItems: string[];
  highlightedIndex: number;
  maxItemsToShow?: number;
  getItemProps: (options: UseComboboxGetItemPropsOptions<string>) => Record<string, unknown>;
}

export const BibstemMenu = (props: IBibstemMenuProps): ReactElement => {
  const { highlightedIndex, getItemProps, inputValue, selectedItems, onItemsChange, maxItemsToShow } = props;

  const [debouncedValue] = useDebounce(inputValue, 400);

  // partially apply the max items
  const searchBibs = useMemo(() => searchBibstems(maxItemsToShow), [maxItemsToShow]);

  // memoize the items filtering (heavy operation)
  const items = useMemo(() => searchBibs(debouncedValue, selectedItems), [debouncedValue, selectedItems]);

  useEffect(() => onItemsChange(items), [items]);

  const { attributes, styles } = usePopper();

  return (
    <List {...attributes.popper} style={styles.popper} variant="autocomplete" borderRadius={0} mt={0.5}>
      {items.map((item, index) => {
        const [bibstem, description] = item.split(ITEM_DELIMITER);
        return (
          <ListItem
            key={`${item}${index}`}
            {...getItemProps({ item, index })}
            backgroundColor={highlightedIndex === index ? 'gray.100' : {}}
          >
            <HStack alignItems="center" spacing={2} justifyContent="space-between">
              <Text fontSize="md" fontWeight="semibold">
                {description}
              </Text>
              <Text fontSize="md" fontWeight="light">
                {bibstem}
              </Text>
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
  const search = new RegExp(`${searchString}`, 'ig');

  try {
    const values = chainFrom(bibstems)
      .filter((bibstem) => search.test(bibstem))
      .filter((bibstem) => !itemsToOmit.includes(bibstem))

      // take any number of maxItems up to a max of 1000
      .take(maxItems <= 0 ? 1000 : maxItems)
      .toArray();
    return values;
  } catch (e) {
    return [];
  }
});
