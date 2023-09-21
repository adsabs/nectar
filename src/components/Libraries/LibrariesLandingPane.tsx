import { useGetLibraries } from '@api';
import { AddIcon, DeleteIcon, Icon } from '@chakra-ui/icons';
import { Box, Button, Flex, Heading, Skeleton, Stack } from '@chakra-ui/react';
import { WrenchIcon } from '@heroicons/react/24/solid';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { ILibraryListTableSort, LibraryListTable } from './LibraryListTable';
import { LibraryTypeSelector } from './LibraryTypeSelector';
import { LibraryMeta, LibraryType } from './types';

export const LibrariesLandingPane = () => {
  const router = useRouter();

  const [pageSize, setPageSize] = useState(10);

  const [pageIndex, setPageIndex] = useState(0);

  const {
    data: libraries,
    isLoading,
    refetch,
  } = useGetLibraries(
    { start: pageIndex * pageSize, rows: pageSize, sort_col: 'date_last_modified', sort_dir: 'desc' },
    { cacheTime: 0 },
  );

  // TODO: temp query to get all libraries so we can get count
  const { data: all } = useGetLibraries({}, { cacheTime: 0 });

  const [libraryType, setLibraryType] = useState<LibraryType>('owner');

  const metadata: LibraryMeta[] = useMemo(
    () =>
      libraries?.libraries
        ? libraries.libraries.map((l) => ({
            id: l.id,
            visibility: l.public ? 'public' : 'private',
            collaborators: l.num_users,
            name: l.name,
            description: l.description,
            papers: l.num_documents,
            owner: l.owner,
            permission: l.permission,
            lastModified: l.date_last_modified,
          }))
        : [],
    [libraries],
  );

  const entries = useMemo(() => {
    return all?.libraries ? all.libraries.length : 0;
  }, [all]); // TODO: get this using API (waiting for implementation)

  const [sort, setSort] = useState<ILibraryListTableSort>({ col: 'name', dir: 'asc' });

  const [selected, setSelected] = useState<string[]>([]);

  const handleSortChange = (sort: ILibraryListTableSort) => {
    // TODO: refetch libraries with new sort
    // if successful
    setSort(sort);
    setPageIndex(0);
  };

  const handlePageIndexChange = (index: number) => {
    // TODO: fetch libs
    // if successful
    setPageIndex(index);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleOpenLibrary = (id: string) => {
    void router.push(`/user/libraries/${id}`);
  };

  const handleLibraryTypeChange = (type: LibraryType) => {
    // TODO: fetch libs
    // if successful
    setLibraryType(type);
  };

  const handleAddLibrary = () => {
    // TODO:
  };

  const handleOperations = () => {
    // TODO:
  };

  const handleDeleteSelected = () => {
    // TODO:
    // if successful, reload libs
    setSelected([]);
  };

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - My Libraries</title>
      </Head>
      <Box>
        <Heading variant="pageTitle" my={4}>
          My Libraries
        </Heading>
        <Flex justifyContent="space-between">
          <Stack w="300px">
            <LibraryTypeSelector type={libraryType} onChange={handleLibraryTypeChange} />
          </Stack>
          <Flex justifyContent="end" gap={1} my={2}>
            {selected.length > 0 ? (
              <Button variant="outline" leftIcon={<DeleteIcon />} colorScheme="red" onClick={handleDeleteSelected}>
                Delete
              </Button>
            ) : null}
            <Button variant="outline" leftIcon={<AddIcon />} onClick={handleAddLibrary}>
              Add New Library
            </Button>
            <Button leftIcon={<Icon as={WrenchIcon} onClick={handleOperations} />}>Operations</Button>
          </Flex>
        </Flex>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <LibraryListTable
            libraries={metadata}
            selected={selected}
            entries={entries}
            sort={sort}
            pageSize={pageSize}
            pageIndex={pageIndex}
            onChangeSort={handleSortChange}
            onChangePageIndex={handlePageIndexChange}
            onChangePageSize={handlePageSizeChange}
            onLibrarySelect={handleOpenLibrary}
            onSetSelected={setSelected}
          />
        )}
      </Box>
    </div>
  );
};

const TableSkeleton = () => (
  <Stack m={5}>
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
    <Skeleton h="30px" />
  </Stack>
);
