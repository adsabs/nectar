import { CheckIcon, CloseIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Tr, Td, Input, IconButton, Table, Thead, Th, Tbody, HStack } from '@chakra-ui/react';
import { useState, ChangeEvent, MouseEvent, useRef } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormValues, IAuthor } from './types';

export const AuthorsTable = ({ editable }: { editable: boolean }) => {
  const {
    fields: authors,
    append,
    remove,
    update,
  } = useFieldArray<FormValues, 'authors'>({
    name: 'authors',
  });

  // New author row being added
  const [newAuthor, setNewAuthor] = useState<IAuthor>(null);

  // Existing row being edited
  const [editAuthor, setEditAuthor] = useState<{ index: number; author: IAuthor }>({
    index: -1,
    author: null,
  });

  const newAuthorNameRef = useRef<HTMLInputElement>();

  const isValidAuthor = (author: IAuthor) => {
    return author && typeof author.name === 'string' && author.name.length > 1;
  };

  const newAuthorIsValid = isValidAuthor(newAuthor);

  const editAuthorIsValid = isValidAuthor(editAuthor.author);

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
    setEditAuthor({ index, author: authors[index] });
  };

  const handleEditNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({ index: prev.index, author: { ...prev.author, name: e.target.value } }));
  };

  const handleEditAffChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({ index: prev.index, author: { ...prev.author, aff: e.target.value } }));
  };

  const handleEditOrcidChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({ index: prev.index, author: { ...prev.author, orcid: e.target.value } }));
  };

  const handleDeleteAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    remove(index);
  };

  const handleApplyEditAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    update(index, editAuthor.author);
    setEditAuthor({ index: -1, author: null });
  };

  const handleCancelEditAuthor = () => {
    setEditAuthor({ index: -1, author: null });
  };

  // Row for adding new author
  const newAuthorTableRow = (
    <Tr>
      <Td color="gray.200">{authors.length + 1}</Td>
      <Td>
        <Input size="sm" onChange={handleNewNameChange} value={newAuthor?.name ?? ''} ref={newAuthorNameRef} />
      </Td>
      <Td>
        <Input size="sm" onChange={handleNewAffChange} value={newAuthor?.aff ?? ''} />
      </Td>
      <Td>
        <Input size="sm" onChange={handleNewOrcidChange} value={newAuthor?.orcid ?? ''} />
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
    <Table size="sm" variant="simple">
      <Thead>
        <Tr>
          <Th aria-label="index" w="4%"></Th>
          <Th>Name</Th>
          <Th>Affiliation</Th>
          <Th>ORCiD</Th>
          {editable && <Th w="10%">Actions</Th>}
        </Tr>
      </Thead>
      <Tbody>
        {authors.map((a, index) =>
          editAuthor.index === index ? (
            <Tr key={`author-${index}`}>
              <Td>{index + 1}</Td>
              <Td>
                <Input size="sm" onChange={handleEditNameChange} value={editAuthor.author.name} autoFocus />
              </Td>
              <Td>
                <Input size="sm" onChange={handleEditAffChange} value={editAuthor.author.aff} />
              </Td>
              <Td>
                <Input size="sm" onChange={handleEditOrcidChange} value={editAuthor.author.orcid} />
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
            <Tr key={`author-${index}`}>
              <Td>{index + 1}</Td>
              <Td>{a.name}</Td>
              <Td>{a.aff}</Td>
              <Td>{a.orcid}</Td>
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
  );
};
