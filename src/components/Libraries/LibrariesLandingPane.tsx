import {
  IADSApiLibraryOperationParams,
  LibraryIdentifier,
  useAddLibrary,
  useGetLibraries,
  useLibraryOperation,
} from '@api';
import { AddIcon, Icon, RepeatIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, IconButton, Stack, useDisclosure, useToast } from '@chakra-ui/react';
import { WrenchIcon } from '@heroicons/react/24/solid';
import { AppState, useStore } from '@store';
import { NumPerPageType } from '@types';
import { parseAPIError } from '@utils';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { AddLibraryModal } from './AddLibraryModal';
import { ILibraryListTableSort, LibraryListTable } from './LibraryListTable';
import { LibraryTypeSelector } from './LibraryTypeSelector';
import { OperationModal } from './OperationModal';
import { TableSkeleton } from './TableSkeleton';
import { LibraryType } from './types';

export const LibrariesLandingPane = () => {
  const router = useRouter();

  const pageSize = useStore((state: AppState) => state.numPerPage);

  const setPageSize = useStore((state: AppState) => state.setNumPerPage);

  const toast = useToast({
    duration: 2000,
  });

  const [pageIndex, setPageIndex] = useState(0);

  const [sort, setSort] = useState<ILibraryListTableSort>({ col: 'date_last_modified', dir: 'desc' });

  const [libraryType, setLibraryType] = useState<LibraryType>('all');

  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();

  const { isOpen: isOperationOpen, onOpen: onOperationOpen, onClose: onOperationClose } = useDisclosure();

  // query all libraries
  const {
    data: librariesData,
    isLoading,
    refetch,
    remove: clearCache,
  } = useGetLibraries({ start: pageIndex * pageSize, rows: pageSize, sort: sort.col, order: sort.dir });

  const libraries = useMemo(() => {
    if (librariesData) {
      return librariesData.libraries;
    }
  }, [librariesData]);

  // TODO: temp query to get all libraries so we can get count
  const { data: all, refetch: recount } = useGetLibraries({}, { cacheTime: 0, staleTime: 0 });

  const entries = useMemo(() => {
    return all?.libraries ? all.libraries.length : 0;
  }, [all]); // TODO: get this using API (waiting for implementation)

  // add library
  const { mutate: addLibrary, isLoading: isAddingLibrary } = useAddLibrary();

  // library operation
  const { mutate: operateLibrary, isLoading: isOperatingLibrary } = useLibraryOperation();

  const refresh = () => {
    // refetch libraries and reset lib count
    clearCache();
    void refetch();
    void recount();
  };

  const handleSortChange = (sort: ILibraryListTableSort) => {
    setSort(sort);
    setPageIndex(0);
  };

  const handlePageIndexChange = (index: number) => {
    setPageIndex(index);
  };

  const handlePageSizeChange = (size: NumPerPageType) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleOpenLibrary = (id: LibraryIdentifier) => {
    void router.push(`/user/libraries/${id}`);
  };

  const handleLibraryTypeChange = (type: LibraryType) => {
    // TODO: fetch libs
    // if successful
    setLibraryType(type);
  };

  const handleAddLibrary = (name: string, description: string, isPublic: boolean) => {
    addLibrary(
      { name, description, public: isPublic },
      {
        onSettled: (data, error) => {
          if (error) {
            toast({ status: 'error', title: parseAPIError(error) });
          } else {
            toast({ status: 'success', title: `Successfully added "${name}"` });

            // close modal
            onAddClose();

            // refetch libraries and reset lib count
            refresh();
          }
        },
      },
    );
  };

  const handleOperation = (params: IADSApiLibraryOperationParams) => {
    operateLibrary(params, {
      onSettled: (data, error) => {
        if (error) {
          toast({ status: 'error', title: parseAPIError(error) });
        } else {
          toast({ status: 'success', title: `Action Successful` });

          onOperationClose();

          // refetch libraries and reset lib count
          refresh();
        }
      },
    });
  };

  const handleReload = () => {
    void refetch();
  };

  return (
    <div>
      <Box>
        <Heading variant="pageTitle" my={4}>
          My Libraries
        </Heading>
        <Flex direction={{ base: 'column', md: 'row' }} justifyContent={{ base: 'start', md: 'space-between' }}>
          <Stack w="300px">
            <LibraryTypeSelector type={libraryType} onChange={handleLibraryTypeChange} />
          </Stack>
          <Flex justifyContent={{ base: 'start', md: 'end' }} gap={1} my={2}>
            <IconButton aria-label="Reload table" icon={<RepeatIcon />} variant="outline" onClick={handleReload} />
            <Button variant="outline" leftIcon={<AddIcon />} onClick={onAddOpen}>
              Add New Library
            </Button>
            <Button leftIcon={<Icon as={WrenchIcon} />} onClick={onOperationOpen}>
              Operations
            </Button>
          </Flex>
        </Flex>
        {isLoading ? (
          <TableSkeleton r={pageSize} h="30px" />
        ) : (
          <>
            <LibraryListTable
              libraries={libraries}
              entries={entries}
              sort={sort}
              pageSize={pageSize}
              pageIndex={pageIndex}
              onChangeSort={handleSortChange}
              onChangePageIndex={handlePageIndexChange}
              onChangePageSize={handlePageSizeChange}
              onLibrarySelect={handleOpenLibrary}
              onUpdate={handleReload}
            />
            <AddLibraryModal
              isOpen={isAddOpen}
              onClose={onAddClose}
              onAddLibrary={handleAddLibrary}
              isLoading={isAddingLibrary}
            />
            <OperationModal
              isOpen={isOperationOpen}
              onClose={onOperationClose}
              onOperate={handleOperation}
              isLoading={isOperatingLibrary}
            />
          </>
        )}
      </Box>
    </div>
  );
};
