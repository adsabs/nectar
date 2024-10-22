import {
  Box,
  Button,
  Code,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';

import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useEffect, useState } from 'react';
import { sort } from 'ramda';

import { DescriptionCollapse } from '@/components/CitationExporter';
import { customFormatDescription } from '@/components/Settings';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { noop } from '@/utils/common/noop';
import { CustomFormat } from '@/api/user/types';

export interface ICustomFormatsTableProps {
  customFormats: CustomFormat[];
  selected?: CustomFormat['id'];
  onSelect?: (id: string) => void;
  onModify: (id: string, name: string, code: string) => void;
  onAdd: (name: string, code: string) => void;
  onDelete: (id: string) => void;
}

export const CustomFormatsTable = ({
  customFormats,
  selected = null,
  onModify,
  onAdd,
  onDelete,
  onSelect = noop,
}: ICustomFormatsTableProps) => {
  return (
    <DescriptionCollapse body={customFormatDescription} label="Custom Formats">
      {({ btn, content }) => (
        <FormControl>
          <Box mb="2">
            <FormLabel htmlFor="custom-formats" fontSize={['sm', 'md']}>
              {'Custom Formats'} {btn}
            </FormLabel>
            {content}
          </Box>
          <CFTable
            selected={selected}
            onSelect={onSelect}
            customFormats={customFormats}
            onAdd={onAdd}
            onModify={onModify}
            onDelete={onDelete}
          />
        </FormControl>
      )}
    </DescriptionCollapse>
  );
};

interface ICFTableProps {
  customFormats: CustomFormat[];
  selected?: CustomFormat['id'];
  onSelect?: (id: string) => void;
  onModify: (id: string, name: string, code: string) => void;
  onAdd: (name: string, code: string) => void;
  onDelete: (id: string) => void;
}

const CFTable = ({ customFormats, selected = null, onSelect = noop, onModify, onAdd, onDelete }: ICFTableProps) => {
  const [items, setItems] = useState(sort((a, b) => (a.name < b.name ? -1 : 1), customFormats));
  const [isEditing, setIsEditing] = useState<string>(null);
  const [isAdding, setIsAdding] = useState<Omit<CustomFormat, 'id'>>(null);

  useEffect(() => setItems(sort((a, b) => (a.name < b.name ? -1 : 1), customFormats)), [customFormats]);

  const handleIsEditing = (id: string) => {
    setIsEditing(id);
  };

  const handleModify = (id: string, name: string, code: string) => {
    if (name.length > 0 && code.length > 0) {
      onModify(id, name, code);
      setIsEditing(null);
    }
  };

  const handleCancelEdit = () => {
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
      {items ? (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th w="35%">Name</Th>
                <Th w="50%">Format</Th>
                <Th w="15%">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items?.map((f) => (
                <SortableRow
                  key={f.id}
                  format={f}
                  isSelected={selected && selected === f.id}
                  onSelect={onSelect}
                  isEditable={isAdding !== null || isEditing !== null}
                  isEditing={isEditing && isEditing === f.id}
                  onEdit={handleIsEditing}
                  onCancelEdit={handleCancelEdit}
                  onModify={handleModify}
                  onDelete={onDelete}
                />
              ))}
              {isAdding && (
                <Tr>
                  <Td>
                    <Input
                      value={isAdding.name}
                      placeholder="New Format"
                      onChange={(e) => setIsAdding({ ...isAdding, name: e.target.value })}
                      autoFocus
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
      ) : null}
    </>
  );
};

const SortableRow = ({
  format,
  isSelected = false,
  onSelect = noop,
  isEditable,
  isEditing,
  onEdit,
  onCancelEdit,
  onModify,
  onDelete,
}: {
  format: CustomFormat;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isEditable: boolean;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: (id: string) => void;
  onModify: (id: string, name: string, code: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [formatValue, setFormatValue] = useState(format);

  const { tableHighlightBackgroud } = useColorModeColors();

  const handleApplyModify = () => {
    if (formatValue.name.length > 0 && formatValue.code.length > 0) {
      onModify(format.id, formatValue.name, formatValue.code);
    }
  };

  const handleCancelModify = () => {
    setFormatValue({ ...format });
    onCancelEdit(format.id);
  };

  const handleSelect = () => {
    onSelect(format.id);
  };

  return (
    <Tr backgroundColor={isSelected ? tableHighlightBackgroud : 'transparent'} onClick={handleSelect}>
      {isEditing ? (
        <>
          <Td>
            <Input
              value={formatValue.name}
              onChange={(event) => setFormatValue((prev) => ({ ...prev, name: event.target.value }))}
            />
          </Td>
          <Td>
            <Input
              value={formatValue.code}
              onChange={(event) => setFormatValue((prev) => ({ ...prev, code: event.target.value }))}
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
                onClick={handleApplyModify}
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
          <Td>{formatValue.name}</Td>
          <Td>
            <Code>{formatValue.code}</Code>
          </Td>
          <Td>
            <Stack direction="row" gap={1}>
              <IconButton
                aria-label="Edit custom format"
                variant="outline"
                icon={<EditIcon />}
                size="xs"
                isDisabled={isEditable}
                onClick={() => onEdit(format.id)}
              />
              <IconButton
                aria-label="Delete custom format"
                variant="outline"
                colorScheme="red"
                icon={<DeleteIcon />}
                size="xs"
                isDisabled={isEditable}
                onClick={() => onDelete(format.id)}
              />
            </Stack>
          </Td>
        </>
      )}
    </Tr>
  );
};
