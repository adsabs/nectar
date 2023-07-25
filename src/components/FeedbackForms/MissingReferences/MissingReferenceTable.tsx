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
import { FieldArray, FieldArrayRenderProps, useField } from 'formik';
import { useState, ChangeEvent, MouseEvent, useRef } from 'react';
import { Reference } from './types';

export const MissingReferenceTable = () => {
  // the input fields for adding a new reference
  const [newReference, setNewReference] = useState<Reference>({ citing: '', cited: '' });

  const newReferenceRef = useRef<HTMLInputElement>();

  // editing reference input values
  const [editingReference, setEditingReference] = useState<{ index: number; reference: Reference }>({
    index: -1,
    reference: { citing: '', cited: '' },
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

  const handleEditCitingInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingReference((prev) => ({ index: prev.index, reference: { ...prev.reference, citing: e.target.value } }));
  };

  const handleEditCitedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingReference((prev) => ({ index: prev.index, reference: { ...prev.reference, cited: e.target.value } }));
  };

  const handleCancelEditReference = () => {
    setEditingReference({ index: -1, reference: { citing: '', cited: '' } });
  };

  const [referencesField] = useField<Reference[]>({
    name: 'references',
    validate: (value: Reference[]) => {
      if (!value || value.length === 0) {
        return 'This field requires at least one entry';
      }
    },
  });

  const references = referencesField.value;

  return (
    <FieldArray name="references">
      {({ remove, push, form, replace }: FieldArrayRenderProps) => (
        <FormControl isInvalid={form.touched.references && !!form.errors.references}>
          <FormLabel>Missing References</FormLabel>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Th aria-label="index" w="4%"></Th>
                <Th>Citing Bibcode</Th>
                <Th>Cited Bibcode</Th>
                <Th>Actions</Th>
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
                        />
                      </Td>
                      <Td>
                        <Input
                          size="sm"
                          onChange={handleEditCitedInputChange}
                          value={editingReference.reference.cited}
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
                            onClick={() => {
                              replace(index, editingReference.reference);
                              setEditingReference({ index: -1, reference: { citing: '', cited: '' } });
                            }}
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
                      <Td>{r.citing}</Td>
                      <Td>{r.cited}</Td>
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
                            onClick={() => remove(index)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ),
                )}
                <Tr>
                  <Td color="gray.200">{references.length + 1}</Td>
                  <Td>
                    <Input
                      size="sm"
                      placeholder="1998ApJ...501L..41Y"
                      onChange={handleCitingInputChange}
                      value={newReference.citing}
                      ref={newReferenceRef}
                    />
                  </Td>
                  <Td>
                    <Input
                      size="sm"
                      placeholder="1998ApJ...501L..41Y"
                      onChange={handleCitedInputChange}
                      value={newReference.cited}
                    />
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="add missing reference"
                      icon={<CheckIcon />}
                      variant="outline"
                      colorScheme="green"
                      isDisabled={newReference.citing.length === 0 || newReference.cited.length === 0}
                      onClick={() => {
                        push(newReference);
                        setNewReference({ citing: '', cited: '' });
                        newReferenceRef.current.focus();
                      }}
                    />
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
          <FormErrorMessage>{form.errors.references}</FormErrorMessage>
        </FormControl>
      )}
    </FieldArray>
  );
};
