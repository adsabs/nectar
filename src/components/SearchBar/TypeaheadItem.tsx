import { TypeaheadOption } from '@/components/SearchBar/types';
import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { Code, DarkMode, Flex, LightMode, ListItem, ListItemProps, Text, useColorMode } from '@chakra-ui/react';

interface ITypeaheadItemProps extends ListItemProps {
  item: TypeaheadOption;
  index: number;
  focused: boolean;
  dispatch: Dispatch<SearchInputAction>;
  showValue?: boolean;
  onClick?: () => void;
}

export const TypeaheadItem = (props: ITypeaheadItemProps) => {
  const { focused, item, dispatch, index, onClick, showValue = true, ...listItemProps } = props;
  const liRef = useRef<HTMLLIElement>(null);
  const colors = useColorModeColors();
  const { colorMode } = useColorMode();
  const [isMouseOver, setIsMouseOver] = useState(false);

  const handleClick = useCallback(() => {
    dispatch({ type: 'FOCUS_ITEM', index });
    dispatch({ type: 'CLICK_ITEM' });
    if (typeof onClick === 'function') {
      onClick();
    }
  }, [dispatch, index, onClick]);

  const handleMouseOver = () => {
    setIsMouseOver(true);
  };

  const handleMouseLeave = () => {
    setIsMouseOver(false);
  };

  // scroll element into view when focused
  useEffect(() => {
    if (typeof liRef.current?.scrollIntoView === 'function' && focused) {
      liRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [liRef, focused]);

  return (
    <ListItem
      ref={liRef}
      backgroundColor={focused ? 'blue.100' : 'auto'}
      _hover={{ cursor: 'pointer', backgroundColor: colors.highlightBackground }}
      px="2"
      py="1"
      onClick={handleClick}
      role="presentation"
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      data-focused={focused}
      {...listItemProps}
    >
      <Flex direction="column">
        <Flex role="option" aria-label={item.label} aria-atomic="true">
          <Text flex="1" role="presentation">
            {item.label}
          </Text>
          {showValue && (
            <>
              {(colorMode === 'dark' && isMouseOver) || colorMode === 'light' ? (
                <LightMode>
                  <Code>{item.value}</Code>
                </LightMode>
              ) : (
                <DarkMode>
                  <Code>{item.value}</Code>
                </DarkMode>
              )}
            </>
          )}
        </Flex>
        {item.desc && (
          <Text mx={2} fontSize="xs" fontWeight="light">
            {item.desc}
          </Text>
        )}
      </Flex>
    </ListItem>
  );
};
