import { forwardRef } from 'react';
import { ISearchInputProps, QuickFields, SearchInput } from '@/components';
import { VStack } from '@chakra-ui/react';

export const SearchBar = forwardRef<HTMLInputElement, ISearchInputProps>((props, ref) => {
  return (
    <VStack as="section" direction="column" spacing={2} align="stretch">
      <QuickFields isLoading={props.isLoading} />
      <SearchInput ref={ref} {...props} />
    </VStack>
  );
});
