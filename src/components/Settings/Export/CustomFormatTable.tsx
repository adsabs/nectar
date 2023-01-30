import { CustomFormat } from '@api';
import { CheckIcon, CloseIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Table, Thead, Tr, Th, Tbody, Td, Input, Stack, IconButton, Code, Button } from '@chakra-ui/react';
import { useState } from 'react';

export const CustomFormatTable = ({
  customFormats,
  onModify,
  onAdd,
  onDelete,
}: {
  customFormats: CustomFormat[];
  onModify: (id: string, name: string, code: string) => void;
  onAdd: (name: string, code: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState<CustomFormat>(null);
  const [isAdding, setIsAdding] = useState<Omit<CustomFormat, 'id'>>(null);

  const handleModify = () => {
    const { id, name, code } = isEditing;
    if (name.length > 0 && code.length > 0) {
      onModify(id, name, code);
      setIsEditing(null);
    }
  };

  const handleCancelModify = () => {
    setIsEditing(null);
  };

  const handleAdd = () => {
    const { name, code } = isAdding;
    if (name.length > 0 && code.length > 0) {
      onAdd(name, code);
      setIsAdding(null);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(null);
  };

  return (
    <>
      <Table>
        <Thead>
          <Tr>
            <Th w="40%">Name</Th>
            <Th w="40%">Format</Th>
            <Th w="20%">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {customFormats?.map(({ id, code, name }) => (
            <Tr key={id}>
              {isEditing?.id === id ? (
                <>
                  <Td>
                    <Input
                      value={isEditing.name}
                      onChange={(event) => setIsEditing({ ...isEditing, name: event.target.value })}
                    />
                  </Td>
                  <Td>
                    <Input
                      value={isEditing.code}
                      onChange={(event) => setIsEditing({ ...isEditing, code: event.target.value })}
                    />
                  </Td>
                  <Td>
                    <Stack direction="row" gap={1}>
                      <IconButton
                        aria-label="Apply"
                        variant="outline"
                        icon={<CheckIcon />}
                        size="xs"
                        colorScheme="green"
                        onClick={handleModify}
                      />
                      <IconButton
                        aria-label="Cancel"
                        variant="outline"
                        icon={<CloseIcon />}
                        size="xs"
                        colorScheme="red"
                        onClick={handleCancelModify}
                      />
                    </Stack>
                  </Td>
                </>
              ) : (
                <>
                  <Td>{name}</Td>
                  <Td>
                    <Code>{code}</Code>
                  </Td>
                  <Td>
                    <Stack direction="row" gap={1}>
                      <IconButton
                        aria-label="Edit custom format"
                        variant="outline"
                        icon={<EditIcon />}
                        size="xs"
                        isDisabled={isAdding !== null || isEditing !== null}
                        onClick={() => setIsEditing({ id, name, code })}
                      />
                      <IconButton
                        aria-label="Delete custom format"
                        variant="outline"
                        colorScheme="red"
                        icon={<DeleteIcon />}
                        size="xs"
                        isDisabled={isAdding !== null || isEditing !== null}
                        onClick={() => onDelete(id)}
                      />
                    </Stack>
                  </Td>
                </>
              )}
            </Tr>
          ))}
          {isAdding && (
            <Tr>
              <Td>
                <Input
                  value={isAdding.name}
                  placeholder="New Format"
                  onChange={(e) => setIsAdding({ ...isAdding, name: e.target.value })}
                />
              </Td>
              <Td>
                <Input
                  value={isAdding.code}
                  placeholder="%l (%Y), %j, %V, %p.\n"
                  onChange={(e) => setIsAdding({ ...isAdding, code: e.target.value })}
                />
              </Td>
              <Td>
                <Stack direction="row" gap={1}>
                  <IconButton
                    aria-label="Apply"
                    variant="outline"
                    icon={<CheckIcon />}
                    size="xs"
                    colorScheme="green"
                    onClick={handleAdd}
                  />
                  <IconButton
                    aria-label="Cancel"
                    variant="outline"
                    icon={<CloseIcon />}
                    size="xs"
                    colorScheme="red"
                    onClick={handleCancelAdd}
                  />
                </Stack>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
      <Button
        mt={2}
        onClick={() => setIsAdding({ name: '', code: '' })}
        isDisabled={isAdding !== null || isEditing !== null}
      >
        Add
      </Button>
    </>
  );
};
