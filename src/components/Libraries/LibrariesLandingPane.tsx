import { AddIcon, Icon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, Stack, useDisclosure, useToast } from '@chakra-ui/react';
import { WrenchIcon } from '@heroicons/react/24/solid';
import { AppState, useStore } from '@/store';
import { NumPerPageType } from '@/types';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { AddLibraryModal } from './AddLibraryModal';
import { ILibraryListTableSort, LibraryListTable } from './LibraryListTable';
import { LibraryTypeSelector } from './LibraryTypeSelector';
import { OperationModal } from './OperationModal';
import { TableSkeleton } from './TableSkeleton';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IADSApiLibraryOperationParams, LibraryIdentifier, LibraryType } from '@/api/biblib/types';
import { useAddLibrary, useGetLibraries, useLibraryOperation } from '@/api/biblib/libraries';

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
    remove,
  } = useGetLibraries({
    start: pageIndex * pageSize,
    rows: pageSize,
    sort: sort.col,
    order: sort.dir,
    access_type: libraryType,
  });

  const libraries = librariesData?.libraries ?? [];

  const count = librariesData?.count ?? 0;

  // add library
  const { mutate: addLibrary, isLoading: isAddingLibrary } = useAddLibrary();

  // library operation
  const { mutate: operateLibrary, isLoading: isOperatingLibrary } = useLibraryOperation();

  // only if libraries updated and need to clear cache
  const refresh = () => {
    remove();
    void refetch();
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
    void refresh();
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
            <Button variant="outline" leftIcon={<AddIcon />} onClick={onAddOpen} data-testid="add-new-lib-btn">
              Add New Library
            </Button>
            <Button leftIcon={<Icon as={WrenchIcon} />} onClick={onOperationOpen} data-testid="lib-operation-btn">
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
              entries={count}
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
