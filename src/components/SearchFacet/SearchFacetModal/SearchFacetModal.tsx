import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from '@chakra-ui/icons';
import {
  Box,
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
  useToast,
} from '@chakra-ui/react';
import { IFacetListProps, LogicSelect } from '@/components/SearchFacet/FacetList';
import { AlphaSorter } from '@/components/SearchFacet/SearchFacetModal/AlphaSorter';
import { SearchInput } from '@/components/SearchFacet/SearchFacetModal/SearchInput';
import { SortControl } from '@/components/SearchFacet/SearchFacetModal/SortControl';
import { useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { keyToPath, parseTitleFromKey } from '../helpers';
import { SelectedList } from './SelectedList';
import { useDebounce } from '@/lib/useDebounce';
import { FACET_DEFAULT_PREFIX, useGetFacetData } from '../useGetFacetData';
import { useDownloadFile } from '@/lib/useDownloadFile';
import { join, pipe, pluck } from 'ramda';
import { parseAPIError } from '@/utils/common/parseAPIError';

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

const createBreadcrumbs = (key: string) => {
  const parts = keyToPath(key);
  const crumbs: Array<ReactElement> = [];
  parts.forEach((part) => {
    crumbs.push(
      <Flex key={part} direction="row">
        <ChevronRightIcon fontSize="4xl" />
        <Heading size="lg">{part}</Heading>
      </Flex>,
    );
  });
  return crumbs;
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
      <ModalHeader>
        <Stack direction="row" alignItems="center">
          <Heading size="lg">{params.label}</Heading>
          {focused ? createBreadcrumbs(focused.id) : null}
        </Stack>
      </ModalHeader>
      <ModalBody>
        <Flex direction="column" w="full" mb="3">
          <>
            <Stack spacing={[1, 12]} justify="space-between" alignItems="end" direction={['column', 'row']} mb="4">
              {sort[0] === 'index' ? (
                <Box flex="1" />
              ) : (
                <SearchInput flex="2" search={search} onSearchChange={setSearch} />
              )}
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
          <UnExpandButton />
          <FacetDownloadButton />
          {children({ searchTerm })}
        </Flex>
      </ModalBody>
      <ModalFooter>
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

  const handleUnExpand = useCallback(() => {
    if (focused) {
      setFocused(focused.parentId);
    }
  }, [focused]);

  if (!focused) {
    return null;
  }

  const prevKey = parseTitleFromKey(focused.id);

  return (
    <Stack spacing="2">
      <Button ml="-2" variant="unstyled" aria-label={`go back to ${prevKey}`} onClick={handleUnExpand}>
        <Flex direction="row" alignItems="center">
          <ChevronLeftIcon fontSize="3xl" />
          <Text fontSize="2xl">{prevKey}</Text>
        </Flex>
      </Button>
      <Divider />
    </Stack>
  );
};

const FacetDownloadButton = () => {
  const [enabled, setEnabled] = useState(false);
  const toast = useToast({ duration: 2000, id: 'facet-download' });
  const params = useFacetStore((state) => state.params);
  const { sort } = useGetSearchTerm();
  const isDownloadable = !params.field.endsWith('_hier');

  const { treeData, isSuccess, error, isFetching } = useGetFacetData({
    ...params,
    searchTerm: undefined,
    prefix: FACET_DEFAULT_PREFIX,
    level: 'root',
    sortDir: sort[1],
    offset: 0,
    limit: 2000,
    enabled,
  });

  const formatData = useCallback(() => pipe(pluck('val'), join('\n'))(treeData), [treeData]);

  const { onDownload } = useDownloadFile(formatData, { filename: 'fulllist.txt' });

  useEffect(() => {
    if (enabled && isSuccess) {
      setEnabled(false);
      if (!toast.isActive('facet-download')) {
        toast({ status: 'success', title: 'Download complete.' });
      }
      onDownload();
    }
    if (error) {
      if (!toast.isActive('facet-download')) {
        toast({ status: 'error', title: 'Failed to get the list.', description: parseAPIError(error) });
      }
    }
  }, [treeData, error, isSuccess, toast, onDownload, enabled]);

  if (isDownloadable) {
    return (
      <Flex direction="row" justifyContent="end">
        <Button
          w="fit-content"
          onClick={() => setEnabled(true)}
          variant="ghost"
          fontSize="md"
          leftIcon={<DownloadIcon aria-hidden />}
          isLoading={isFetching}
        >
          <Text>Download full list</Text>
        </Button>
      </Flex>
    );
  }
  return null;
};
