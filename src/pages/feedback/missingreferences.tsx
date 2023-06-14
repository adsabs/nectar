import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Button,
  Text,
  Box,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
  TableContainer,
  IconButton,
} from '@chakra-ui/react';
import { FeedbackLayout, SimpleLink } from '@components';
import { feedbackItems } from '@components/NavBar/FeedbackDropdown';
import { NextPage } from 'next';
import { ChangeEvent, MouseEvent, useState } from 'react';

type Reference = [string, string];

const MissingReferences: NextPage = () => {
  // added references
  const [references, setReferences] = useState<Reference[]>([]);

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

  const handleAddReference = () => {
    setReferences((prev) => [...prev, newReference]);
    // clear input fields
    setNewReference(['', '']);
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

  const handleDeleteReference = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setReferences((prev) => prev.slice(0, index).concat(prev.slice(index + 1)));
  };

  const handleApplyEditReference = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setReferences((prev) => {
      const ret = [...prev];
      ret[index] = editingReference.reference;
      return ret;
    });
    setEditingReference({ index: -1, reference: ['', ''] });
  };

  const handleCancelEditReference = () => {
    setEditingReference({ index: -1, reference: ['', ''] });
  };

  // Row for adding new reference
  const newReferenceTableRow = (
    <Tr>
      <Td color="gray.200">{references.length + 1}</Td>
      <Td>
        <Input size="sm" placeholder="1998ApJ...501L..41Y" onChange={handleCitingInputChange} value={newReference[0]} />
      </Td>
      <Td>
        <Input size="sm" placeholder="1998ApJ...501L..41Y" onChange={handleCitedInputChange} value={newReference[1]} />
      </Td>
      <Td>
        <IconButton
          aria-label="add missing reference"
          icon={<CheckIcon />}
          variant="outline"
          colorScheme="green"
          isDisabled={newReference[0].length === 0 || newReference[1].length === 0}
          onClick={handleAddReference}
        />
      </Td>
    </Tr>
  );

  return (
    <FeedbackLayout title="Submit missing references for the ADS Abstract Service">
      <Text my={2}>Please use this form to submit one or more citations currently missing from our databases.</Text>
      <Text my={2}>
        In order to use this form you will need to know the bibcodes of the citing and cited papers, and enter them in
        the appropriate fields.
      </Text>
      <Text my={2}>
        If either the citing or cited paper is not in ADS you should
        <SimpleLink href={feedbackItems.record.path} display="inline">
          {' '}
          submit a record{' '}
        </SimpleLink>
        for it first.
      </Text>
      <Box as="form" my={2}>
        <Flex direction="column" gap={4}>
          <HStack gap={2}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input></Input>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email"></Input>
            </FormControl>
          </HStack>
          <FormControl>
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
                          <Input
                            size="sm"
                            onChange={handleEditCitingInputChange}
                            value={editingReference.reference[0]}
                          />
                        </Td>
                        <Td>
                          <Input
                            size="sm"
                            onChange={handleEditCitedInputChange}
                            value={editingReference.reference[1]}
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
                              onClick={handleApplyEditReference}
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
                              data-index={index}
                              onClick={handleDeleteReference}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ),
                  )}
                  {newReferenceTableRow}
                </Tbody>
              </Table>
            </TableContainer>
          </FormControl>
          <HStack mt={2}>
            <Button type="submit">Submit</Button>
            <Button type="reset" variant="outline">
              Reset
            </Button>
          </HStack>
        </Flex>
      </Box>
    </FeedbackLayout>
  );
};

export default MissingReferences;
