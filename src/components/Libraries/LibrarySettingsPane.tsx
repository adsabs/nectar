import { LibraryIdentifier, useDeleteLibrary, useEditLibraryMeta, useGetLibraryEntity, useTransfer } from '@api';
import { ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  Text,
  Flex,
  useToast,
  Switch,
  AlertDialog,
  useDisclosure,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { SimpleLink } from '@components/SimpleLink';
import { isValidEmail, parseAPIError } from '@utils';
import { useRouter } from 'next/router';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { CollabTable } from './CollabTable';

export interface ISettingsPaneProps {
  id: LibraryIdentifier;
}

export const LibrarySettingsPane = ({ id }: ISettingsPaneProps) => {
  const router = useRouter();
  const {
    data: library,
    isLoading,
    refetch,
  } = useGetLibraryEntity(
    {
      id,
    },
    { enabled: !!id },
  );

  const { mutate: deleteLibrary } = useDeleteLibrary();

  const toast = useToast({
    duration: 2000,
  });

  const { mutate: updateMeta } = useEditLibraryMeta();

  const { name, description, permission, owner, public: isPublic } = library.metadata;

  const { mutate: transfer } = useTransfer();

  const [nameValue, setNameValue] = useState(name);

  const [descValue, setDescValue] = useState(description);

  const [isChecked, setIsChecked] = useState(isPublic);

  const modified = useMemo(
    () => name !== nameValue || description !== descValue || isPublic !== isChecked,
    [nameValue, descValue, name, description, isChecked, isPublic],
  );

  const canEdit = permission === 'owner' || permission === 'admin';

  const handleOnNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };

  const handleOnDescChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescValue(e.target.value);
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  const handleSave = () => {
    updateMeta(
      {
        id,
        description: descValue !== description ? descValue : undefined,
        name: nameValue !== name ? nameValue : undefined,
        public: isPublic !== isChecked ? isChecked : undefined,
      },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error saving changes',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: 'Updated',
            });
            void refetch();
          }
        },
      },
    );
  };

  const handleTransfer = (newUser: string) => {
    transfer(
      { id, email: newUser },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error transfering ownership',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: `Successfully transferred ownership to ${newUser}`,
            });
            void router.push({ pathname: '/user/libraries' });
          }
        },
      },
    );
  };

  const handleDeleteLibrary = () => {
    deleteLibrary(
      { id },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error deleting library',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: 'Library deleted',
            });
            void router.push({ pathname: '/user/libraries' });
          }
        },
      },
    );
  };

  return (
    <Container maxW="container.lg" mt={4}>
      <Box>
        <Heading variant="pageTitle" as="h1" my={4}>
          <SimpleLink href={'/user/libraries'} display="inline">
            My Libraries
          </SimpleLink>
          <ChevronRightIcon mx={2} />
          <SimpleLink href={`/user/libraries/${id}`} display="inline">
            {name}
          </SimpleLink>
          <ChevronRightIcon mx={2} />
          Settings
        </Heading>
      </Box>
      <Flex direction="column" gap={4} alignItems="start">
        <FormControl>
          <FormLabel>Library Name</FormLabel>
          <Input value={nameValue} isReadOnly={!canEdit} onChange={handleOnNameChange} />
        </FormControl>
        <FormControl>
          <FormLabel>
            Description{' '}
            <Text display="inline" fontWeight="normal" fontStyle="italic">
              (max 200 characters)
            </Text>
          </FormLabel>
          <Textarea value={descValue} isReadOnly={!canEdit} maxLength={200} onChange={handleOnDescChange} />
        </FormControl>
        <FormControl>
          <Flex>
            <FormLabel>Make library public?</FormLabel>
            <Switch isChecked={isChecked} onChange={handleCheckboxChange} isDisabled={!canEdit} />
          </Flex>
          <Text>
            Public libraries are available for all to read. Private libraries are visible to only you and any
            collaborators. The public address of this library is {/* TODO: public library */}
          </Text>
        </FormControl>
        {canEdit && (
          <Button onClick={handleSave} isDisabled={nameValue.length < 1 || !modified} isLoading={isLoading}>
            Save
          </Button>
        )}
        <FormControl>
          <FormLabel>Permission</FormLabel>
          {permission}
        </FormControl>
        <FormControl>
          <FormLabel>Owner</FormLabel>
          {owner}
          {permission === 'owner' && <TransferLibrary onTransfer={handleTransfer} />}
        </FormControl>
        {canEdit && (
          <>
            <Text fontWeight="bold">Collaborators</Text>
            <CollabTable id={id} />
          </>
        )}
        {permission === 'owner' && <DeleteLibrary onDelete={handleDeleteLibrary} />}
      </Flex>
    </Container>
  );
};

const DeleteLibrary = ({ onDelete }: { onDelete: () => void }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <>
      <Button onClick={onOpen} colorScheme="red" mt={4}>
        Delete Library
      </Button>
      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Library
            </AlertDialogHeader>
            <AlertDialogBody>Are you sure? You can't undo this action.</AlertDialogBody>
            <AlertDialogFooter backgroundColor="transparent">
              <Button ref={cancelRef} onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

const TransferLibrary = ({ onTransfer }: { onTransfer: (user: string) => void }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [email, setEmail] = useState('');

  const isValid = isValidEmail(email);

  const handleTransfer = () => {
    if (isValid) {
      onTransfer(email);
      setEmail('');
      onClose();
    }
  };

  const handleCancel = () => {
    setEmail('');
    onClose();
  };

  return (
    <>
      <Button variant="outline" mx={2} onClick={onOpen}>
        Transfer Ownership
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transfer library to another owner</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>New Owner</FormLabel>
              <Input placeholder="new-owner@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
          </ModalBody>

          <ModalFooter backgroundColor="transparent">
            <Button variant="outline" mr={3} onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} isDisabled={!isValid}>
              Transfer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
