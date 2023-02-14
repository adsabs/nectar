import { CustomFormat } from '@api';
import {
  FormControl,
  FormLabel,
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Input,
  Stack,
  IconButton,
  Code,
  Button,
} from '@chakra-ui/react';
import { customFormatDescription, DescriptionCollapse } from '@components';
import { CheckIcon, CloseIcon, EditIcon, DeleteIcon, DragHandleIcon } from '@chakra-ui/icons';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CSSProperties, useState, useEffect } from 'react';

export interface ICustomFormatsTableProps {
  customFormats: CustomFormat[];
  onModify: (id: string, name: string, code: string) => void;
  onAdd: (name: string, code: string) => void;
  onDelete: (id: string) => void;
  onShiftPosition: (fromId: string, toId: string) => void;
}

export const CustomFormatsTable = ({
  customFormats,
  onModify,
  onAdd,
  onDelete,
  onShiftPosition,
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
            customFormats={customFormats}
            onAdd={onAdd}
            onModify={onModify}
            onDelete={onDelete}
            onShiftPosition={onShiftPosition}
          />
        </FormControl>
      )}
    </DescriptionCollapse>
  );
};

const CFTable = ({
  customFormats,
  onModify,
  onAdd,
  onDelete,
  onShiftPosition,
}: {
  customFormats: CustomFormat[];
  onModify: (id: string, name: string, code: string) => void;
  onAdd: (name: string, code: string) => void;
  onDelete: (id: string) => void;
  onShiftPosition: (fromId: string, toId: string) => void;
}) => {
  const [items, setItems] = useState(customFormats);
  const [isEditing, setIsEditing] = useState<string>(null);
  const [isAdding, setIsAdding] = useState<Omit<CustomFormat, 'id'>>(null);

  useEffect(() => setItems(customFormats), [customFormats]);

  // click and drag need to move certain distance before activating
  // this avoid collision with clicking on edit/delete buttons on draggable row
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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

  const handleOnDragEnd = ({ active, over }: DragEndEvent) => {
    // change the ordering of items locally
    if (active && over && active.id !== over.id) {
      setItems((prevItems) => {
        const newItems = JSON.parse(JSON.stringify(prevItems)) as CustomFormat[];
        const fromPos = items.findIndex((f) => f.id === active.id);
        const fromFormat = items[fromPos];
        const toPos = items.findIndex((f) => f.id === over.id);
        newItems.splice(fromPos, 1);
        newItems.splice(toPos, 0, fromFormat);
        return newItems;
      });

      // callback
      onShiftPosition(active.id as string, over.id as string);
    }
  };

  return (
    <>
      {items ? (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th></Th>
                <Th w="40%">Name</Th>
                <Th w="40%">Format</Th>
                <Th w="15%">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              <DndContext onDragEnd={handleOnDragEnd} sensors={sensors}>
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  {items?.map((f) => (
                    <SortableRow
                      key={f.id}
                      format={f}
                      isEditable={isAdding !== null || isEditing !== null}
                      isEditing={isEditing && isEditing === f.id}
                      onEdit={handleIsEditing}
                      onCancelEdit={handleCancelEdit}
                      onModify={handleModify}
                      onDelete={onDelete}
                      isDraggable={isAdding === null || isEditing === null}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {isAdding && (
                <Tr>
                  <Td></Td>
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
      ) : null}
    </>
  );
};

const SortableRow = ({
  format,
  isEditable,
  isEditing,
  onEdit,
  onCancelEdit,
  onModify,
  onDelete,
}: {
  format: CustomFormat;
  isEditable: boolean;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onCancelEdit: (id: string) => void;
  onModify: (id: string, name: string, code: string) => void;
  onDelete: (id: string) => void;
  isDraggable: boolean;
}) => {
  const { listeners, attributes, setNodeRef, transform, transition } = useSortable({
    id: format.id,
    strategy: verticalListSortingStrategy,
  });

  const [formatValue, setFormatValue] = useState(format);

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleApplyModify = () => {
    if (formatValue.name.length > 0 && formatValue.code.length > 0) {
      onModify(format.id, formatValue.name, formatValue.code);
    }
  };

  const handleCancelModify = () => {
    onCancelEdit(format.id);
  };

  return (
    <Tr {...attributes} {...listeners} style={style} ref={setNodeRef}>
      {isEditing ? (
        <>
          <Td>
            <DragHandleIcon mr="1" />
          </Td>
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
          <Td>
            <DragHandleIcon mr="1" />
          </Td>
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
