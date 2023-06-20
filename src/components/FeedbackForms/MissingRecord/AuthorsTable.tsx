import { CheckIcon, CloseIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Tr, Td, Input, IconButton, TableContainer, Table, Thead, Th, Tbody, HStack } from '@chakra-ui/react';
import { useState, ChangeEvent, MouseEvent } from 'react';
import { IAuthor } from './types';

export const AuthorsTable = ({
  authors,
  onAddAuthor,
  onDeleteAuthor,
  onUpdateAuthor,
}: {
  authors: IAuthor[];
  onAddAuthor: (author: IAuthor) => void;
  onDeleteAuthor: (index: number) => void;
  onUpdateAuthor: (index: number, author: IAuthor) => void;
}) => {
  // New author row being added
  const [newAuthor, setNewAuthor] = useState<IAuthor>(null);

  // Existing row being edited
  const [editAuthor, setEditAuthor] = useState<{ index: number; author: IAuthor }>({
    index: -1,
    author: null,
  });

  const isValidAuthor = ({ last, first }: IAuthor) => {
    return typeof last === 'string' && last.length > 1 && typeof first === 'string' && first.length > 1;
  };

  const newAuthorIsValid = !!newAuthor && isValidAuthor(newAuthor);

  // Changes to fields for adding new author

  const handleNewLastNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthor((prev) => ({ ...prev, last: e.target.value }));
  };

  const handleNewFirstNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthor((prev) => ({ ...prev, first: e.target.value }));
  };

  const handleNewAffChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthor((prev) => ({ ...prev, aff: e.target.value }));
  };

  const handleNewOrcidChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAuthor((prev) => ({ ...prev, orcid: e.target.value }));
  };

  const handleAddAuthor = () => {
    onAddAuthor(newAuthor);
    // clear input fields
    setNewAuthor(null);
  };

  // Changes to fields for existing authors

  const handleEditAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setEditAuthor({ index, author: authors[index] });
  };

  const handleEditLastNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({ index: prev.index, author: { ...prev.author, last: e.target.value } }));
  };

  const handleEditFirstNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({ index: prev.index, author: { ...prev.author, first: e.target.value } }));
  };

  const handleEditAffChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({ index: prev.index, author: { ...prev.author, aff: e.target.value } }));
  };

  const handleEditOrcidChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditAuthor((prev) => ({ index: prev.index, author: { ...prev.author, orcid: e.target.value } }));
  };

  const handleDeleteAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    onDeleteAuthor(index);
  };

  const handleApplyEditAuthor = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    onUpdateAuthor(index, editAuthor.author);
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
        <Input size="sm" onChange={handleNewLastNameChange} value={newAuthor?.last ?? ''} />
      </Td>
      <Td>
        <Input size="sm" onChange={handleNewFirstNameChange} value={newAuthor?.first ?? ''} />
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
    <TableContainer>
      <Table size="sm">
        <Thead>
          <Th aria-label="index" w="4%"></Th>
          <Th>Last Name</Th>
          <Th>First Name</Th>
          <Th>Affiliation</Th>
          <Th>ORCiD</Th>
          <Th>Actions</Th>
        </Thead>
        <Tbody>
          {authors.map((a, index) =>
            editAuthor.index === index ? (
              <Tr key={`author-${index}`}>
                <Td>{index + 1}</Td>
                <Td>
                  <Input size="sm" onChange={handleEditLastNameChange} value={editAuthor.author.last} />
                </Td>
                <Td>
                  <Input size="sm" onChange={handleEditFirstNameChange} value={editAuthor.author.first} />
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
                <Td>{a.last}</Td>
                <Td>{a.first}</Td>
                <Td>{a.aff}</Td>
                <Td>{a.orcid}</Td>
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
              </Tr>
            ),
          )}
          {newAuthorTableRow}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
