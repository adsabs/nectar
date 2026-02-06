import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';

import { useStore } from '@/store';

import { parseAPIError } from '@/utils/common/parseAPIError';
import { LibraryIdentifier } from '@/api/biblib/types';
import {
  useAddDocumentsByQuery,
  useAddLibrary,
  useEditLibraryDocuments,
  useGetLibraries,
} from '@/api/biblib/libraries';
import { ILibraryListTableSort, LibraryListTable } from './LibraryListTable';
import { NumPerPageType } from '@/types';
import { TableSkeleton } from './TableSkeleton';

export type SelectionType = 'all' | 'selected';

export const AddToLibraryModal = ({
  bibcodes,
  isOpen,
  onClose,
}: {
  bibcodes?: string[];
  isOpen: boolean;
  onClose: (added?: boolean) => void;
}) => {
  const selectedDocs = useStore((state) => state.docs.selected);

  const query = useStore((state) => state.query);

  const clearSelections = useStore((state) => state.clearSelected);

  const { mutate: editDocs, isLoading: isEditingDocs } = useEditLibraryDocuments();

  const { mutate: addDocsByQuery, isLoading: isAddingDocs } = useAddDocumentsByQuery();

  const toast = useToast();

  const handleAddToLibrary = (ids: LibraryIdentifier[]) => {
    if (bibcodes?.length > 0 || selectedDocs?.length > 0) {
      // add selected
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];

        editDocs(
          {
            id,
            bibcode: bibcodes ?? selectedDocs,
            action: 'add',
          },
          {
            onSettled(data, error) {
              if (error) {
                toast({
                  status: 'error',
                  title: 'Error adding to library',
                  description: parseAPIError(error),
                });
              } else {
                toast({
                  status: 'success',
                  title: `${data.number_added} papers added to ${ids.length} ${
                    id.length > 1 ? 'libraries' : 'library'
                  } `,
                });
                clearSelections();
                onClose(true);
              }
            },
          },
        );
      }
    } else {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        addDocsByQuery(
          {
            id,
            params: { q: query.q },
            action: 'add',
          },
          {
            onSettled(data, error) {
              if (data) {
                toast({
                  status: 'success',
                  title: `${data.number_added} papers added to ${ids.length} ${
                    id.length > 1 ? 'libraries' : 'library'
                  }`,
                });
                clearSelections();
                onClose(true);
              } else if (error) {
                toast({
                  status: 'error',
                  title: 'Error adding to library',
                  description: parseAPIError(error),
                });
              }
            },
          },
        );
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false)} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Add{' '}
          <Text color="green.500" display="inline" fontWeight="bold">
            {bibcodes ? bibcodes.length : selectedDocs && selectedDocs.length !== 0 ? selectedDocs.length : 'all'}{' '}
            paper(s)
          </Text>{' '}
          to:
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="soft-rounded">
            <TabList>
              <Tab>Existing Libraries</Tab>
              <Tab>New Library</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <AddToExistingLibraryPane
                  onClose={onClose}
                  onSubmit={handleAddToLibrary}
                  isLoading={isEditingDocs || isAddingDocs}
                />
              </TabPanel>
              <TabPanel>
                <AddToNewLibraryPane
                  onClose={onClose}
                  onSubmit={handleAddToLibrary}
                  isLoading={isEditingDocs || isAddingDocs}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const AddToExistingLibraryPane = ({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: (added: boolean) => void;
  onSubmit: (ids: LibraryIdentifier[]) => void;
  isLoading: boolean;
}) => {
  const [pageSize, setPageSize] = useState<NumPerPageType>(10);

  const [pageIndex, setPageIndex] = useState(0);

  const [sort, setSort] = useState<ILibraryListTableSort>({ col: 'date_last_modified', dir: 'desc' });

  const [selectedLibs, setSelectedLibs] = useState<LibraryIdentifier[]>([]);

  const { data: librariesData, isLoading: isLoadingLibraries } = useGetLibraries({
    start: pageIndex * pageSize,
    rows: pageSize,
    sort: sort.col,
    order: sort.dir,
  });

  const libraries = useMemo(() => {
    if (librariesData) {
      return librariesData.libraries;
    }
  }, [librariesData]);

  const entries = useMemo(() => {
    if (librariesData) {
      return librariesData.count;
    }
  }, [librariesData]);

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

  const handleSelectLibrary = (id: LibraryIdentifier) => {
    if (selectedLibs.includes(id)) {
      // deselect
      setSelectedLibs((prev) => prev.filter((l) => l !== id));
    } else {
      // select
      setSelectedLibs((prev) => [...prev, id]);
    }
  };

  const handleOnSubmit = () => {
    onSubmit(selectedLibs);
  };

  const handleCancel = () => {
    setSelectedLibs([]);
    onClose(false);
  };

  return (
    <>
      {isLoading || isLoadingLibraries ? (
        <TableSkeleton r={pageSize} h="30px" />
      ) : (
        <>
          <Text fontSize="sm">
            {selectedLibs.length === 0
              ? 'No libraries selected'
              : `${selectedLibs.length} ${selectedLibs.length > 1 ? 'libraries' : 'library'} selected`}{' '}
            {selectedLibs.length > 0 && (
              <Button size="sm" ml={2} variant="link" onClick={() => setSelectedLibs([])}>
                remove all
              </Button>
            )}
          </Text>
          <LibraryListTable
            libraries={libraries}
            entries={entries}
            sort={sort}
            pageSize={pageSize}
            pageIndex={pageIndex}
            showIndex={false}
            showSettings={false}
            showDescription={false}
            hideCols={['public', 'num_users', 'permission', 'date_created']}
            selectable
            selected={selectedLibs}
            onChangeSort={handleSortChange}
            onChangePageIndex={handlePageIndexChange}
            onChangePageSize={handlePageSizeChange}
            onLibrarySelect={handleSelectLibrary}
          />
        </>
      )}

      <HStack mt={4} justifyContent="end">
        <Button
          onClick={handleOnSubmit}
          isDisabled={selectedLibs.length === 0}
          isLoading={isLoading || isLoadingLibraries}
        >
          Submit
        </Button>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </HStack>
    </>
  );
};

const AddToNewLibraryPane = ({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: (added: boolean) => void;
  onSubmit: (ids: LibraryIdentifier[]) => void;
  isLoading: boolean;
}) => {
  interface FormValues {
    name: string;
    desc: string;
    isPublic: boolean;
  }

  const initialFormValues: FormValues = {
    name: '',
    desc: '',
    isPublic: false,
  };

  const validationSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    desc: z.string(),
    isPublic: z.boolean(),
  });

  const formMethods = useForm<FormValues>({
    defaultValues: initialFormValues,
    resolver: zodResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register,
    getValues,
    formState: { errors },
    reset,
    handleSubmit,
  } = formMethods;

  const { mutate: addLibrary, isLoading: isAddingLib } = useAddLibrary();

  const toast = useToast();

  const handleOnSubmit = () => {
    const { name, desc, isPublic } = getValues();
    addLibrary(
      { name, description: desc, public: isPublic },
      {
        onSettled(data, error) {
          if (data) {
            onSubmit([data.id]);
          } else {
            toast({ status: 'error', title: parseAPIError(error) });
          }
        },
      },
    );
  };

  const handleCancel = () => {
    reset();
    onClose(false);
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(handleOnSubmit)}>
        <Flex direction="column" gap={2}>
          <FormControl isRequired isInvalid={!!errors?.name}>
            <FormLabel>Enter a name for the new library: </FormLabel>
            <Input {...register('name')} autoFocus />
            <FormErrorMessage>{errors?.name && errors.name.message}</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Description: </FormLabel>
            <Textarea {...register('desc')} />
          </FormControl>
          <Checkbox {...register('isPublic')}>Make library public</Checkbox>
          <Text fontSize="sm" fontStyle="italic">
            Public libraries are available for all to read. Private libraries are visible to only you and any
            collaborators.
          </Text>
        </Flex>
        <HStack mt={4} justifyContent="end">
          <Button type="submit" isLoading={isAddingLib || isLoading}>
            Submit
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </HStack>
      </form>
    </FormProvider>
  );
};
