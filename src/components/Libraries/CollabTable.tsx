import { CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import { HStack, Icon, IconButton, Input, Table, Tbody, Td, Text, Th, Thead, Tr, useToast } from '@chakra-ui/react';

import { Select, SelectOption } from '@/components/Select';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/solid';
import { keys, values } from 'ramda';
import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { SelectInstance } from 'react-select';
import { TableSkeleton } from './TableSkeleton';
import { CustomInfoMessage } from '@/components/Feedbacks';

import { isValidEmail } from '@/utils/common/isValidEmail';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { LibraryIdentifier, LibraryPermission, permissions } from '@/api/biblib/types';
import { useGetPermission, useModifyPermission } from '@/api/biblib/libraries';

const permissionOptions: SelectOption<LibraryPermission>[] = permissions
  .filter((p) => p !== 'owner')
  .map((p) => ({
    id: p,
    label: p,
    value: p,
  }));

export const CollabTable = ({ id }: { id: LibraryIdentifier }) => {
  const { data, isLoading, error, refetch } = useGetPermission({ id: id });

  const { mutate: modifyPermission } = useModifyPermission();

  const toast = useToast({
    duration: 2000,
  });

  const collaborators = useMemo(
    () =>
      data
        ? data
            .filter((u) => getHighestPermission(values(u)[0]) !== 'owner')
            .map((u) => ({ user: keys(u)[0], permission: getHighestPermission(values(u)[0]) }))
        : null,
    [data],
  );

  // New user being added
  const [newUser, setNewUser] = useState({ user: '', permission: 'read' });

  const newUserInputRef = useRef<never>();

  const newUserIsValid = !!newUser && isValidEmail(newUser.user);

  // Changes to fields for adding new Reference

  const handleNewPermissionChange = (option: SelectOption<LibraryPermission>) => {
    setNewUser((prev) => ({ ...prev, permission: option.id }));
  };

  const handleNewUserChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUser((prev) => ({ ...prev, user: e.target.value }));
  };

  const handleExistingPermissionChange = (user: string, permission: LibraryPermission) => {
    modifyPermission(
      {
        id,
        email: user,
        permission: { admin: false, write: false, read: false, [permission]: true },
      },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error modifying permission',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: 'Permission successfully modified',
            });
          }
          void refetch();
        },
      },
    );
  };

  const handleAddUser = () => {
    modifyPermission(
      {
        id,
        email: newUser.user,
        permission: { [newUser.permission]: true },
      },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error adding user',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: 'Collaborator added successfully',
            });
          }
          void refetch();
        },
      },
    );
    // clear input fields
    setNewUser({ user: '', permission: 'read' });
    (newUserInputRef.current as SelectInstance).focus();
  };

  const handleDeleteUser = (user: string) => {
    modifyPermission(
      {
        id,
        email: user,
        permission: { admin: false, write: false, read: false },
      },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error deleting collaborator',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: 'Collaborator deleted successfully',
            });
          }
          void refetch();
        },
      },
    );
  };

  // Row for adding new Reference
  const newUserTableRow = (
    <Tr data-testid="new-collaborator-row">
      <Td color="gray.200">{collaborators?.length + 1}</Td>
      <Td>
        <Input size="sm" onChange={handleNewUserChange} value={newUser?.user ?? ''} ref={newUserInputRef} />
      </Td>
      <Td>
        <Select
          options={permissionOptions}
          value={
            newUser?.permission ? permissionOptions.find((o) => o.id === newUser.permission) : permissionOptions[0]
          }
          label="new collaborator's permission"
          hideLabel
          id="permission-type-new"
          stylesTheme="default.sm"
          onChange={handleNewPermissionChange}
          menuPortalTarget={document.body}
        />
      </Td>
      <Td>
        <IconButton
          aria-label="add collaborator"
          icon={<CheckIcon />}
          variant="outline"
          colorScheme="green"
          isDisabled={!newUserIsValid}
          onClick={handleAddUser}
          data-testid="add-collaborator-btn"
        />
      </Td>
    </Tr>
  );

  return (
    <>
      {isLoading && <TableSkeleton r={5} />}
      {!isLoading && error && <CustomInfoMessage status="error" title="Unable to load collaborators" />}
      {!isLoading && !error ? (
        <>
          <HStack>
            <Icon
              as={collaborators.length > 0 ? UserGroupIcon : UserIcon}
              color={collaborators.length > 0 ? 'green.500' : 'gray.500'}
              aria-hidden
              w={4}
              h={4}
            />{' '}
            <Text display="inline">
              This library has {collaborators.length === 0 ? 'no' : collaborators.length} collaborators
            </Text>
          </HStack>
          <Table size="sm" data-testid="collab-table">
            <Thead>
              <Tr>
                <Th aria-label="position" w="10%"></Th>
                <Th>Email</Th>
                <Th w="30%">Permission</Th>
                <Th w="10%"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {collaborators.map((u, index) => (
                <Tr key={`user-${index}`} data-testid="collaborator-row">
                  <Td>{index + 1}</Td>
                  <Td>{u.user}</Td>
                  <Td>
                    <Select
                      options={permissionOptions}
                      value={u.permission ? permissionOptions.find((o) => o.id === u.permission) : permissionOptions[0]}
                      label="new collaborator's permission"
                      hideLabel
                      id={`permission-type-user-${u.user}`}
                      stylesTheme="default.sm"
                      onChange={(o) => handleExistingPermissionChange(u.user, o.id)}
                      menuPortalTarget={document.body}
                    />
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="delete collaborator"
                      icon={<DeleteIcon />}
                      variant="outline"
                      colorScheme="red"
                      onClick={() => handleDeleteUser(u.user)}
                    />
                  </Td>
                </Tr>
              ))}
              {newUserTableRow}
            </Tbody>
          </Table>
        </>
      ) : (
        <TableSkeleton r={5} />
      )}
    </>
  );
};

const getHighestPermission = (perms: LibraryPermission[]): string => {
  for (let i = 0; i < permissions.length; i++) {
    if (perms.includes(permissions[i])) {
      return permissions[i];
    }
  }
  return null;
};
