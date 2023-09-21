import { useAddLibrary, useGetLibraries } from '@api';
import { AddIcon, Icon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { WrenchIcon } from '@heroicons/react/24/solid';
import { parseAPIError } from '@utils';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChangeEvent, useMemo, useState } from 'react';
import { ILibraryListTableSort, LibraryListTable } from './LibraryListTable';
import { LibraryTypeSelector } from './LibraryTypeSelector';
import { LibraryMeta, LibraryType } from './types';

export const LibrariesLandingPane = () => {
  const router = useRouter();

  const toast = useToast({
    duration: 2000,
  });

  const [pageSize, setPageSize] = useState(10);

  const [pageIndex, setPageIndex] = useState(0);

  // query all libraries
  const {
    data: libraries,
    isLoading,
    refetch,
  } = useGetLibraries(
    { start: pageIndex * pageSize, rows: pageSize, sort_col: 'date_last_modified', sort_dir: 'desc' },
    { cacheTime: 0, staleTime: 0 },
  );

  // TODO: temp query to get all libraries so we can get count
  const { data: all, refetch: recount } = useGetLibraries({}, { cacheTime: 0, staleTime: 0 });

  // add library
  const { mutate: addLibrary } = useAddLibrary();

  const [libraryType, setLibraryType] = useState<LibraryType>('owner');

  const { isOpen, onOpen, onClose } = useDisclosure();

  const metadata: LibraryMeta[] = useMemo(
    () =>
      libraries?.libraries
        ? libraries.libraries.map((l) => ({
            id: l.id,
            visibility: l.public ? 'public' : 'private',
            collaborators: l.num_users, // TODO: does this inculde owner?
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

  // this will cause a refresh as well
  const reset = () => {
    setPageIndex(0);
  };

  const refresh = () => {
    // refetch libraries and reset lib count
    void refetch();
    void recount();
  };

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

  const handleAddLibrary = (name: string, description: string, isPublic: boolean) => {
    addLibrary(
      { name, description, public: isPublic },
      {
        onSettled: (data, error) => {
          if (error) {
            toast({ status: 'error', title: parseAPIError(error) });
          } else {
            toast({ status: 'success', title: `Successfully added "${name}"` });

            // refetch libraries and reset lib count
            refresh();
          }
        },
      },
    );
  };

  const handleOperations = () => {
    // TODO:
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
            <Button variant="outline" leftIcon={<AddIcon />} onClick={onOpen}>
              Add New Library
            </Button>
            <Button leftIcon={<Icon as={WrenchIcon} onClick={handleOperations} />}>Operations</Button>
          </Flex>
        </Flex>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
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
            <NewLibModal isOpen={isOpen} onClose={onClose} onAddLibrary={handleAddLibrary} />
          </>
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

const NewLibModal = ({
  isOpen,
  onClose,
  onAddLibrary,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddLibrary: (name: string, desc: string, isPublic: boolean) => void;
}) => {
  const [name, setName] = useState('');

  const [desc, setDesc] = useState('');

  const [isPublic, setIsPublic] = useState(false);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleDescChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDesc(e.target.value);
  };

  const handleCheckPublic = (e: ChangeEvent<HTMLInputElement>) => {
    setIsPublic(e.target.checked);
  };

  const handleAddLibrary = () => {
    onAddLibrary(name, desc, isPublic);
    setName('');
    setDesc('');
    setIsPublic(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add A New Library</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap={2}>
            <FormControl>
              <FormLabel>Enter a name for the new library: </FormLabel>
              <Input onChange={handleNameChange} value={name} />
            </FormControl>
            <FormControl>
              <FormLabel>Description: </FormLabel>
              <Textarea onChange={handleDescChange} value={desc} />
            </FormControl>
            <Checkbox isChecked={isPublic} onChange={handleCheckPublic}>
              Make library public
            </Checkbox>
          </Flex>
        </ModalBody>

        <ModalFooter backgroundColor="transparent" gap={1}>
          <Button onClick={handleAddLibrary} isDisabled={name.length < 2}>
            Add
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
