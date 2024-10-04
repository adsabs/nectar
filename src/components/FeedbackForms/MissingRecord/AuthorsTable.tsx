import { CheckIcon, CloseIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Tr, Td, Input, IconButton, Table, Thead, Th, Tbody, HStack } from '@chakra-ui/react';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState, ChangeEvent, MouseEvent, useRef, useMemo, KeyboardEvent } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormValues, IAuthor } from './types';
import { PaginationControls } from '@/components/Pagination';

export const AuthorsTable = ({ editable }: { editable: boolean }) => {
  const {
    fields: authors,
    append,
    remove,
    update,
    move,
  } = useFieldArray<FormValues, 'authors'>({
    name: 'authors',
  });

  // New author row being added
  const [newAuthor, setNewAuthor] = useState<IAuthor>(null);

  // Existing row being edited
  const [editAuthor, setEditAuthor] = useState<{ index: number; author: IAuthor; position: string }>({
    index: -1,
    author: null,
    position: null,
  });

  const newAuthorNameRef = useRef<HTMLInputElement>();

  const isValidAuthor = (author: IAuthor) => {
    return author && typeof author.name === 'string' && author.name.length > 1;
  };

  const newAuthorIsValid = isValidAuthor(newAuthor);

  const editAuthorIsValid = isValidAuthor(editAuthor.author);

  const columnHelper = createColumnHelper<IAuthor>();
  const columns = useMemo(() => {
    return [
      columnHelper.display({
        cell: (info) => info.row.index + 1,
        header: 'Position',
      }),
      columnHelper.accessor('name', {
        cell: (info) => info.getValue(),
        header: 'Name',
      }),
      columnHelper.accessor('aff', {
        cell: (info) => info.getValue(),
        header: 'Affilication',
      }),
      columnHelper.accessor('orcid', {
        cell: (info) => info.getValue(),
        header: 'ORCiD',
      }),
    ];
  }, [columnHelper]);

  const table = useReactTable({
    columns,
    data: authors,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Changes to fields for adding new author

  const handleNewNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthor((prev) => ({ ...prev, name: e.target.value }));
  };

  const handleNewAffChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthor((prev) => ({ ...prev, aff: e.target.value }));
  };

  const handleNewOrcidChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthor((prev) => ({ ...prev, orcid: e.target.value }));
  };

  const handleAddAuthor = () => {
    append(newAuthor);
    // clear input fields
    setNewAuthor(null);
    newAuthorNameRef.current.focus();
  };

  // Changes to fields for existing authors

  const handleEditAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setEditAuthor({ index, author: authors[index], position: (index + 1).toString() });
  };

  const handleEditPositionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({
      ...prev,
      position: e.target.value,
    }));
  };

  const handleEditNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({
      ...prev,
      author: { ...prev.author, name: e.target.value },
    }));
  };

  const handleEditAffChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({
      ...prev,
      author: { ...prev.author, aff: e.target.value },
    }));
  };

  const handleEditOrcidChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({
      ...prev,
      author: { ...prev.author, orcid: e.target.value },
    }));
  };

  const handleDeleteAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    remove(index);
  };

  const handleApplyEditAuthor = () => {
    update(editAuthor.index, editAuthor.author);
    const newPosition = parseInt(editAuthor.position);
    if (typeof newPosition === 'number' && newPosition > 0 && newPosition <= authors.length) {
      move(editAuthor.index, parseInt(editAuthor.position) - 1);
    }
    setEditAuthor({ index: -1, author: null, position: null });
  };

  const handleCancelEditAuthor = () => {
    setEditAuthor({ index: -1, author: null, position: null });
  };

  const handleKeydownEditAuthor = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editAuthorIsValid) {
      handleApplyEditAuthor();
    }
  };

  const handleKeydownNewAuthor = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newAuthorIsValid) {
      handleAddAuthor();
    }
  };

  // Row for adding new author
  const newAuthorTableRow = (
    <Tr>
      <Td color="gray.200">{authors.length + 1}</Td>
      <Td>
        <Input
          size="sm"
          onChange={handleNewNameChange}
          value={newAuthor?.name ?? ''}
          ref={newAuthorNameRef}
          onKeyDown={handleKeydownNewAuthor}
        />
      </Td>
      <Td>
        <Input
          size="sm"
          onChange={handleNewAffChange}
          value={newAuthor?.aff ?? ''}
          onKeyDown={handleKeydownNewAuthor}
        />
      </Td>
      <Td>
        <Input
          size="sm"
          onChange={handleNewOrcidChange}
          value={newAuthor?.orcid ?? ''}
          onKeyDown={handleKeydownNewAuthor}
        />
      </Td>
      <Td>
        <IconButton
          aria-label="add author"
          icon={<CheckIcon />}
          variant="outline"
          colorScheme="green"
          isDisabled={!newAuthorIsValid}
          onClick={handleAddAuthor}
        />
      </Td>
    </Tr>
  );
  return (
    <>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th aria-label="index" w="4%"></Th>
            <Th>Name</Th>
            <Th>Affiliation</Th>
            <Th w="20%">ORCiD</Th>
            {editable && <Th w="10%">Actions</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row, index) =>
            editAuthor.index === index ? (
              <Tr key={`author-${index}`}>
                <Td>
                  <Input
                    size="sm"
                    onChange={handleEditPositionChange}
                    value={editAuthor.position}
                    type="number"
                    w={10}
                    onKeyDown={handleKeydownEditAuthor}
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    onChange={handleEditNameChange}
                    value={editAuthor.author.name}
                    autoFocus
                    onKeyDown={handleKeydownEditAuthor}
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    onChange={handleEditAffChange}
                    value={editAuthor.author.aff}
                    onKeyDown={handleKeydownEditAuthor}
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    onChange={handleEditOrcidChange}
                    value={editAuthor.author.orcid}
                    onKeyDown={handleKeydownEditAuthor}
                  />
                </Td>
                <Td>
                  <HStack>
                    <IconButton
                      aria-label="apply"
                      icon={<CheckIcon />}
                      variant="outline"
                      colorScheme="green"
                      data-index={index}
                      onClick={handleApplyEditAuthor}
                      isDisabled={!editAuthorIsValid}
                    />
                    <IconButton
                      aria-label="cancel"
                      icon={<CloseIcon />}
                      variant="outline"
                      colorScheme="red"
                      data-index={index}
                      onClick={handleCancelEditAuthor}
                    />
                  </HStack>
                </Td>
              </Tr>
            ) : (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
                ))}
                {editable && (
                  <Td>
                    <HStack>
                      <IconButton
                        aria-label="edit"
                        icon={<EditIcon />}
                        variant="outline"
                        colorScheme="blue"
                        data-index={index}
                        onClick={handleEditAuthor}
                      />
                      <IconButton
                        aria-label="delete"
                        icon={<DeleteIcon />}
                        variant="outline"
                        colorScheme="red"
                        data-index={index}
                        onClick={handleDeleteAuthor}
                      />
                    </HStack>
                  </Td>
                )}
              </Tr>
            ),
          )}
          {editable && newAuthorTableRow}
        </Tbody>
      </Table>
      <PaginationControls table={table} entries={authors} my={5} />
    </>
  );
};
