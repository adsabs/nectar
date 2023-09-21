import { useGetLibraries } from '@api';
import { AddIcon, Icon } from '@chakra-ui/icons';
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

  const { data: libraries, isLoading } = useGetLibraries({}, { cacheTime: 0 });

  const [pageSize, setPageSize] = useState(10);

  const [pageIndex, setPageIndex] = useState(0);

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
    return libraries?.libraries ? libraries.libraries.length : 0;
  }, [libraries]); // TODO: get this using API (waiting for implementation)

  const [sort, setSort] = useState<ILibraryListTableSort>({ col: 'name', dir: 'asc' });

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
    // TODO: fetch libs
    // if successful
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
            <Button variant="outline" leftIcon={<AddIcon />}>
              Add New Library
            </Button>
            <Button leftIcon={<Icon as={WrenchIcon} />}>Operations</Button>
          </Flex>
        </Flex>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <LibraryListTable
            libraries={metadata}
            entries={entries}
            sort={sort}
            pageSize={pageSize}
            pageIndex={pageIndex}
            onChangeSort={handleSortChange}
            onChangePageIndex={handlePageIndexChange}
            onChangePageSize={handlePageSizeChange}
            onLibrarySelect={handleOpenLibrary}
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
