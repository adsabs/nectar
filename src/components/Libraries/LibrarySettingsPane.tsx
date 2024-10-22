import { ChevronLeftIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
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
  Switch,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { DescriptionCollapse } from '@/components/CitationExporter';
import { CustomInfoMessage, LoadingMessage } from '@/components/Feedbacks';
import { SimpleLink } from '@/components/SimpleLink';
import { useRouter } from 'next/router';
import { ChangeEvent, useMemo, useState } from 'react';
import { CollabTable } from './CollabTable';
import { DeleteLibrary } from './DeleteLibrary';

import { isValidEmail } from '@/utils/common/isValidEmail';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { LibraryIdentifier } from '@/api/biblib/types';
import { useDeleteLibrary, useEditLibraryMeta, useGetLibraryEntity, useTransfer } from '@/api/biblib/libraries';

const permissionsDescription = (
  <>
    <Text>
      <i>Read</i>: Can view the contents of a private library.
    </Text>
    <Text>
      <i>Write</i>: Can view a library, add/remove records, add and modify annotations.
    </Text>
    <Text>
      <i>Admin</i>: Can view a library, add/remove records, add and modify annotations, edit the library name and
      description, and add/remove other collaborators
    </Text>
  </>
);

export interface ISettingsPaneProps {
  id: LibraryIdentifier;
  isFromLanding?: boolean;
}

export const LibrarySettingsPane = ({ id, isFromLanding = false }: ISettingsPaneProps) => {
  const router = useRouter();

  const {
    data: library,
    isLoading,
    error,
    refetch,
  } = useGetLibraryEntity(
    {
      id,
    },
    { enabled: !!id, staleTime: 0 },
  );

  const { name, description, permission, owner, public: isPublic, date_created, date_last_modified } = library.metadata;

  const { mutate: deleteLibrary } = useDeleteLibrary();

  const toast = useToast({
    duration: 2000,
  });

  const { mutate: updateMeta } = useEditLibraryMeta();

  const { mutate: transfer, isLoading: isTranfering } = useTransfer();

  const [nameValue, setNameValue] = useState(name);

  const [descValue, setDescValue] = useState(description);

  const [isChecked, setIsChecked] = useState(isPublic);

  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
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
          setIsSaving(false);
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
    <>
      {isLoading && (
        <Center>
          <LoadingMessage message="Loading library" />
        </Center>
      )}
      {error && (
        <CustomInfoMessage
          status={'error'}
          title={'Library not found'}
          description={
            <Text>
              Library does not exist.{' '}
              <SimpleLink href={'/user/libraries'} display="inline">
                View all libraries.
              </SimpleLink>
            </Text>
          }
        />
      )}
      {!isLoading && library && (
        <>
          <Box>
            <Heading variant="pageTitle" as="h1" my={4}>
              <SimpleLink
                href={isFromLanding ? '/user/libraries' : `/user/libraries/${id}`}
                display="inline"
                data-testid="settings-back-btn"
              >
                <ChevronLeftIcon mr={2} />
              </SimpleLink>
              Settings
            </Heading>
          </Box>
          <Flex direction="column" gap={4} alignItems="start">
            <FormControl>
              <FormLabel>Library Name</FormLabel>
              <Input
                value={nameValue}
                isReadOnly={!canEdit}
                onChange={handleOnNameChange}
                data-testid="library-name-input"
              />
            </FormControl>
            <FormControl>
              <FormLabel>
                Description{' '}
                <Text display="inline" fontWeight="normal" fontStyle="italic">
                  (max 200 characters)
                </Text>
              </FormLabel>
              <Textarea
                value={descValue}
                isReadOnly={!canEdit}
                maxLength={200}
                onChange={handleOnDescChange}
                data-testid="library-desc-input"
              />
            </FormControl>
            <FormControl>
              <Flex>
                <FormLabel>Make library public?</FormLabel>
                <Switch
                  isChecked={isChecked}
                  onChange={handleCheckboxChange}
                  isDisabled={!canEdit}
                  data-testid="library-public-switch"
                  aria-label={isChecked ? 'is public' : 'is private'}
                />
              </Flex>
              <Text>
                <Text display="inline" fontStyle="italic">
                  Public libraries
                </Text>{' '}
                are available for all to read.{' '}
                <Text display="inline" fontStyle="italic">
                  Private libraries
                </Text>{' '}
                are visible to only you and any collaborators.{' '}
                <SimpleLink href={`/public-libraries/${id}`}>View as public library</SimpleLink>
              </Text>
            </FormControl>
            {canEdit && (
              <Button onClick={handleSave} isDisabled={nameValue.length < 1 || !modified || isSaving}>
                Save
              </Button>
            )}
            <FormControl className="metadata">
              <FormLabel>Permission</FormLabel>
              {permission}
            </FormControl>
            <FormControl className="metadata">
              <FormLabel>Owner</FormLabel>
              {owner}
              {permission === 'owner' && <TransferLibrary onTransfer={handleTransfer} isLoading={isTranfering} />}
            </FormControl>
            <FormControl className="metadata">
              <FormLabel>Date Created</FormLabel>
              {new Date(date_created).toLocaleString()}
            </FormControl>
            <FormControl className="metadata">
              <FormLabel>Last Modified</FormLabel>
              {new Date(date_last_modified).toLocaleString()}
            </FormControl>
            {canEdit && (
              <>
                <DescriptionCollapse body={permissionsDescription} label="Collaborators">
                  {({ btn, content }) => (
                    <FormControl>
                      <Box mb="2">
                        <FormLabel fontSize={['sm', 'md']}>
                          {'Collaborators'} {btn}
                        </FormLabel>
                        {content}
                      </Box>
                      <CollabTable id={id} />
                    </FormControl>
                  )}
                </DescriptionCollapse>
              </>
            )}
            {permission === 'owner' && <DeleteLibrary onDelete={handleDeleteLibrary} />}
          </Flex>
        </>
      )}
    </>
  );
};

const TransferLibrary = ({ onTransfer, isLoading }: { onTransfer: (user: string) => void; isLoading: boolean }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [email, setEmail] = useState('');

  const isValid = isValidEmail(email);

  const handleTransfer = () => {
    if (isValid) {
      onTransfer(email);
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
              <Input
                placeholder="new-owner@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="transfer-owner-email-input"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter backgroundColor="transparent">
            <Button variant="outline" mr={3} onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              isDisabled={!isValid}
              isLoading={isLoading}
              data-testid="transfer-submit-btn"
            >
              Transfer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
