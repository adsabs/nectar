import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Button,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { IFacetListProps, LogicSelect } from '@components/SearchFacet/FacetList';
import { AlphaSorter } from '@components/SearchFacet/SearchFacetModal/AlphaSorter';
import { SearchInput } from '@components/SearchFacet/SearchFacetModal/SearchInput';
import { SortControl } from '@components/SearchFacet/SearchFacetModal/SortControl';
import { useFacetStore } from '@components/SearchFacet/store/FacetStore';
import { useDebounce } from '@hooks';
import { ReactElement, ReactNode, useMemo } from 'react';
import { parseRootFromKey } from '../helpers';
import { SelectedList } from './SelectedList';

interface ISearchFacetModalProps extends Omit<IFacetListProps, 'onError'> {
  children: (props: { searchTerm: string }) => ReactNode;
}

export const SearchFacetModal = (props: ISearchFacetModalProps): ReactElement => {
  const { children, ...facetTreeProps } = props;

  const isOpen = useFacetStore((state) => state.isOpen);
  const updateModal = useFacetStore((state) => state.updateModal);

  return (
    <Modal isOpen={isOpen} onClose={() => updateModal(false)} size="4xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalFacet {...facetTreeProps}>{children}</ModalFacet>
      </ModalContent>
    </Modal>
  );
};

const ModalFacet = (props: ISearchFacetModalProps) => {
  const { onFilter, children } = props;

  const params = useFacetStore((state) => state.params);
  const focused = useFacetStore((state) => state.focused);
  const setSort = useFacetStore((state) => state.setSort);
  const setSearch = useFacetStore((state) => state.setSearch);
  const setLetter = useFacetStore((state) => state.setLetter);
  const { searchTerm, search, letter, sort } = useGetSearchTerm();

  return (
    <>
      <ModalHeader backgroundColor="gray.100">
        <Stack direction="row" alignItems="center">
          <Heading size="lg">{params.label}</Heading>
          {focused ? (
            <>
              <ChevronRightIcon fontSize="4xl" />
              <Heading size="lg">{parseRootFromKey(focused.id)}</Heading>
            </>
          ) : null}
        </Stack>
      </ModalHeader>
      <ModalBody>
        <Flex direction="column" w="full" mb="3">
          {focused ? null : (
            <>
              <Stack spacing={[1, 12]} justify="space-between" alignItems="end" direction={['column', 'row']} mb="4">
                <SearchInput flex="2" search={search} onSearchChange={setSearch} isDisabled={sort[0] === 'index'} />
                <SortControl sort={sort} onSortChange={setSort} minW="150px" />
              </Stack>
              {sort[0] === 'index' ? (
                <AlphaSorter
                  justify="center"
                  w="full"
                  mb="2"
                  px="2"
                  flexWrap="wrap"
                  letter={letter}
                  onLetterChange={setLetter}
                />
              ) : null}
            </>
          )}
          <UnExpandButton />
          {children({ searchTerm })}
        </Flex>
      </ModalBody>
      <ModalFooter backgroundColor="white">
        <Stack direction="column" spacing="2" justifyContent="center" w="full">
          <SelectedList />
          <LogicSelect onFilter={onFilter} />
        </Stack>
      </ModalFooter>
    </>
  );
};

const SEARCH_DEBOUNCE_WAIT = 300;
const useGetSearchTerm = () => {
  const sort = useFacetStore((state) => state.sort);
  const letter = useFacetStore((state) => state.letter);
  const search = useFacetStore((state) => state.search);

  const searchTerm = useDebounce(
    useMemo(() => (sort[0] === 'index' ? (letter === 'All' ? '' : letter) : search), [sort[0], letter, search]),
    SEARCH_DEBOUNCE_WAIT,
  );

  return {
    searchTerm,
    sort,
    letter,
    search,
  };
};

const UnExpandButton = () => {
  const focused = useFacetStore((state) => state.focused);
  const setFocused = useFacetStore((state) => state.setFocused);

  if (!focused) {
    return null;
  }

  const parsedRoot = parseRootFromKey(focused?.id);

  return (
    <Stack spacing="2">
      <Button ml="-2" variant="unstyled" aria-label={`go back to ${parsedRoot}`} onClick={() => setFocused(null)}>
        <Flex direction="row" alignItems="center">
          <ChevronLeftIcon fontSize="3xl" />
          <Text fontSize="2xl">{parsedRoot}</Text>
        </Flex>
      </Button>
      <Divider />
    </Stack>
  );
};
