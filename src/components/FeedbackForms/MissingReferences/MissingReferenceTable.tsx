import { CheckIcon, CloseIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  FormControl,
  FormLabel,
  TableContainer,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
  Input,
  HStack,
  IconButton,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState, ChangeEvent, MouseEvent, useRef, KeyboardEvent } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormValues, Reference } from './types';

export const MissingReferenceTable = () => {
  // the input fields for adding a new reference
  const [newReference, setNewReference] = useState<Reference>({ citing: '', cited: '' });

  const newReferenceRef = useRef<HTMLInputElement>();

  // editing reference input values
  const [editingReference, setEditingReference] = useState<{ index: number; reference: Reference }>({
    index: -1,
    reference: { citing: '', cited: '' },
  });

  const {
    formState: { errors },
  } = useFormContext<FormValues>();

  const {
    fields: references,
    remove,
    update,
    append,
  } = useFieldArray<FormValues, 'references'>({
    name: 'references',
  });

  // Fields for adding new reference

  const handleCitingInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewReference((prev) => ({ ...prev, citing: e.target.value }));
  };

  const handleCitedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewReference((prev) => ({ ...prev, cited: e.target.value }));
  };

  // Editing existing reference

  const handleEditReference = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setEditingReference({ index, reference: references[index] });
  };

  const handleCancelEditReference = () => {
    setEditingReference({ index: -1, reference: { citing: '', cited: '' } });
  };

  const handleEditCitingInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingReference((prev) => ({ index: prev.index, reference: { ...prev.reference, citing: e.target.value } }));
  };

  const handleEditCitedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingReference((prev) => ({ index: prev.index, reference: { ...prev.reference, cited: e.target.value } }));
  };

  const handleApplyEdit = (index: number) => {
    update(index, editingReference.reference);
    setEditingReference({ index: -1, reference: { citing: '', cited: '' } });
  };

  const handleRemoveReference = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    remove(index);
  };

  const handleAddReference = () => {
    append(newReference);
    setNewReference({ citing: newReference.citing, cited: '' });
    newReferenceRef.current.focus();
  };

  const handleKeydownNewRef = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newReference.citing.length > 0 && newReference.cited.length > 0) {
      handleAddReference();
    }
  };

  const handleKeydownEditRef = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      editingReference.reference.citing.length > 0 &&
      editingReference.reference.cited.length > 0
    ) {
      handleApplyEdit(editingReference.index);
    }
  };

  return (
    <>
      <FormLabel>Missing References</FormLabel>
      <TableContainer>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th aria-label="index" w="4%"></Th>
              <Th>Citing Bibcode</Th>
              <Th>Cited Bibcode</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {references.map((r, index) =>
              editingReference.index === index ? (
                <Tr key={`ref-${r.citing}+${r.cited}`}>
                  <Td>{index + 1}</Td>
                  <Td>
                    <Input
                      size="sm"
                      onChange={handleEditCitingInputChange}
                      value={editingReference.reference.citing}
                      autoFocus
                      onKeyDown={handleKeydownEditRef}
                    />
                  </Td>
                  <Td>
                    <Input
                      size="sm"
                      onChange={handleEditCitedInputChange}
                      value={editingReference.reference.cited}
                      onKeyDown={handleKeydownEditRef}
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
                        isDisabled={
                          editingReference.reference.citing.length === 0 ||
                          editingReference.reference.cited.length === 0
                        }
                        onClick={() => handleApplyEdit(index)}
                      />
                      <IconButton
                        aria-label="cancel"
                        icon={<CloseIcon />}
                        variant="outline"
                        colorScheme="red"
                        data-index={index}
                        onClick={handleCancelEditReference}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ) : (
                <Tr key={`ref-${r.citing}+${r.cited}`}>
                  <Td>{index + 1}</Td>
                  <Td>
                    <FormControl isInvalid={!!errors.references?.[index]?.citing}>
                      {r.citing}
                      <FormErrorMessage>
                        {errors.references?.[index]?.citing && errors.references[index].citing.message}
                      </FormErrorMessage>
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={!!errors.references?.[index]?.cited}>
                      {r.cited}
                      <FormErrorMessage>
                        {errors.references?.[index]?.cited && errors.references[index].cited.message}
                      </FormErrorMessage>
                    </FormControl>
                  </Td>
                  <Td>
                    <HStack>
                      <IconButton
                        aria-label="edit"
                        icon={<EditIcon />}
                        variant="outline"
                        colorScheme="blue"
                        data-index={index}
                        onClick={handleEditReference}
                      />
                      <IconButton
                        aria-label="delete"
                        icon={<DeleteIcon />}
                        variant="outline"
                        colorScheme="red"
                        data-index={index}
                        onClick={handleRemoveReference}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ),
            )}
            <Tr>
              <Td color="gray.200">{references.length + 1}</Td>
              <Td>
                <FormControl isInvalid={!!errors.references?.message}>
                  <Input
                    size="sm"
                    placeholder="1998ApJ...501L..41Y"
                    onChange={handleCitingInputChange}
                    value={newReference.citing}
                    ref={newReferenceRef}
                    onKeyDown={handleKeydownNewRef}
                  />
                  <FormErrorMessage>{errors.references?.message && errors.references?.message}</FormErrorMessage>
                </FormControl>
              </Td>
              <Td>
                <Input
                  size="sm"
                  placeholder="1998ApJ...501L..41Y"
                  onChange={handleCitedInputChange}
                  value={newReference.cited}
                  onKeyDown={handleKeydownNewRef}
                />
              </Td>
              <Td>
                <IconButton
                  aria-label="add missing reference"
                  icon={<CheckIcon />}
                  variant="outline"
                  colorScheme="green"
                  isDisabled={newReference.citing.length === 0 || newReference.cited.length === 0}
                  onClick={handleAddReference}
                />
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};
