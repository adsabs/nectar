import { forwardRef } from 'react';
import { ISearchInputProps, QuickFields, SearchInput } from '@components';
import { VStack } from '@chakra-ui/react';

export interface ISearchBarProps extends ISearchInputProps {}
export const SearchBar = forwardRef<HTMLInputElement, ISearchBarProps>((props, ref) => {
  return (
    <VStack as="section" direction="column" spacing={2} align="stretch">
      <QuickFields isLoading={props.isLoading} />
      <SearchInput ref={ref} {...props} />
    </VStack>
  );
});
