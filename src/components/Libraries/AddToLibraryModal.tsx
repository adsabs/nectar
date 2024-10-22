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
import { LibrarySelector } from './LibrarySelector';
import { useState } from 'react';

import { useStore } from '@/store';

import { parseAPIError } from '@/utils/common/parseAPIError';
import { LibraryIdentifier } from '@/api/biblib/types';
import { useAddDocumentsByQuery, useAddLibrary, useEditLibraryDocuments } from '@/api/biblib/libraries';

export type SelectionType = 'all' | 'selected';

export const AddToLibraryModal = ({
  bibcodes,
  isOpen,
  onClose,
}: {
  bibcodes?: string[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  const selectedDocs = useStore((state) => state.docs.selected);

  const query = useStore((state) => state.query);

  const clearSelections = useStore((state) => state.clearSelected);

  const { mutate: editDocs, isLoading: isEditingDocs } = useEditLibraryDocuments();

  const { mutate: addDocsByQuery, isLoading: isAddingDocs } = useAddDocumentsByQuery();

  const toast = useToast({
    duration: 2000,
  });

  const handleAddToLibrary = (id: LibraryIdentifier) => {
    if (bibcodes?.length > 0 || selectedDocs?.length > 0) {
      // add selected
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
                title: `${data.number_added} papers added to library`,
              });
              clearSelections();
              onClose();
            }
          },
        },
      );
    } else {
      addDocsByQuery(
        {
          id,
          params: { q: query.q },
          action: 'add',
        },
        {
          onSettled(data, error) {
            if (data) {
              toast({ status: 'success', title: `${data.number_added} papers added to library` });
              clearSelections();
              onClose();
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
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Add{' '}
          <Text color="green.500" display="inline" fontWeight="bold">
            {bibcodes ? bibcodes.length : selectedDocs && selectedDocs.length !== 0 ? selectedDocs.length : 'all'}{' '}
            paper(s)
          </Text>{' '}
          to Library
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="soft-rounded">
            <TabList>
              <Tab>Existing Library</Tab>
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
  onClose: () => void;
  onSubmit: (id: LibraryIdentifier) => void;
  isLoading: boolean;
}) => {
  const [library, setLibrary] = useState<LibraryIdentifier>(null);

  const handleOnSubmit = () => {
    onSubmit(library);
  };
  const handleOnClose = () => {
    setLibrary(null);
    onClose();
  };

  return (
    <>
      <LibrarySelector isMultiple={false} onSelect={setLibrary} onDeselect={() => setLibrary(null)} />
      <HStack mt={4} justifyContent="end">
        <Button onClick={handleOnSubmit} isDisabled={!library} isLoading={isLoading}>
          Submit
        </Button>
        <Button variant="outline" onClick={handleOnClose}>
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
  onClose: () => void;
  onSubmit: (id: LibraryIdentifier) => void;
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

  const toast = useToast({
    duration: 2000,
  });

  const handleOnSubmit = () => {
    const { name, desc, isPublic } = getValues();
    addLibrary(
      { name, description: desc, public: isPublic },
      {
        onSettled(data, error) {
          if (data) {
            onSubmit(data.id);
          } else {
            toast({ status: 'error', title: parseAPIError(error) });
          }
        },
      },
    );
  };

  const handleOnClose = () => {
    reset();
    onClose();
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
          <Button variant="outline" onClick={handleOnClose}>
            Cancel
          </Button>
        </HStack>
      </form>
    </FormProvider>
  );
};
