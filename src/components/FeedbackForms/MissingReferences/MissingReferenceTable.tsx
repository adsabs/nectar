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
import { useState, ChangeEvent, MouseEvent } from 'react';

type Reference = [string, string];

export const MissingReferenceTable = () => {
  // the input fields for adding a new reference
  const [newReference, setNewReference] = useState<Reference>(['', '']);

  // editing reference input values
  const [editingReference, setEditingReference] = useState<{ index: number; reference: Reference }>({
    index: -1,
    reference: ['', ''],
  });

  // Fields for adding new reference

  const handleCitingInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewReference((prev) => [e.target.value, prev[1]]);
  };

  const handleCitedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewReference((prev) => [prev[0], e.target.value]);
  };

  // Editing existing reference

  const handleEditReference = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setEditingReference({ index, reference: references[index] });
  };

  const handleEditCitingInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingReference((prev) => ({ index: prev.index, reference: [e.target.value, prev.reference[1]] }));
  };

  const handleEditCitedInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingReference((prev) => ({ index: prev.index, reference: [prev.reference[0], e.target.value] }));
  };

  const handleCancelEditReference = () => {
    setEditingReference({ index: -1, reference: ['', ''] });
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
                    <Tr key={`ref-${r[1]}+${r[1]}`}>
                      <Td>{index + 1}</Td>
                      <Td>
                        <Input size="sm" onChange={handleEditCitingInputChange} value={editingReference.reference[0]} />
                      </Td>
                      <Td>
                        <Input size="sm" onChange={handleEditCitedInputChange} value={editingReference.reference[1]} />
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
                              setEditingReference({ index: -1, reference: ['', ''] });
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
                    <Tr key={`ref-${r[1]}+${r[1]}`}>
                      <Td>{index + 1}</Td>
                      <Td>{r[0]}</Td>
                      <Td>{r[1]}</Td>
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
                      value={newReference[0]}
                    />
                  </Td>
                  <Td>
                    <Input
                      size="sm"
                      placeholder="1998ApJ...501L..41Y"
                      onChange={handleCitedInputChange}
                      value={newReference[1]}
                    />
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="add missing reference"
                      icon={<CheckIcon />}
                      variant="outline"
                      colorScheme="green"
                      isDisabled={newReference[0].length === 0 || newReference[1].length === 0}
                      onClick={() => {
                        push(newReference);
                        setNewReference(['', '']);
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
