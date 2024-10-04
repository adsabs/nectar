import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { FormControl, FormLabel, HStack, IconButton, Input, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Select, SelectOption } from '@/components/Select';
import { ChangeEvent, KeyboardEvent, MouseEvent, useRef, useState } from 'react';
import { FormValues, IReference, ReferenceType, referenceTypes } from './types';
import { SelectInstance } from 'react-select';
import { useFieldArray } from 'react-hook-form';
import { useIsClient } from '@/lib/useIsClient';

export const ReferencesField = () => {
  return (
    <FormControl>
      <FormLabel>References</FormLabel>
      <ReferencesTable editable />
    </FormControl>
  );
};

const typeOptions: SelectOption<ReferenceType>[] = referenceTypes.map((r) => ({
  id: r,
  label: r as string,
  value: r as string,
}));

export const ReferencesTable = ({ editable }: { editable: boolean }) => {
  const isClient = useIsClient();

  const { fields, append, remove, update } = useFieldArray<FormValues, 'references'>({
    name: 'references',
  });

  const references = fields as IReference[];

  // New row being added
  const [newReference, setNewReference] = useState<IReference>({ type: 'Bibcode', reference: '' });

  // Existing row being edited
  const [editReference, setEditReference] = useState<{ index: number; reference: IReference }>({
    index: -1,
    reference: null,
  });

  const newReferenceInputRef = useRef<never>();

  const isValidReference = ({ reference, type }: IReference) => {
    return !!reference && !!type && reference.length > 0;
  };

  const newReferenceIsValid = !!newReference && isValidReference(newReference);

  const editReferenceisValid = editReference.reference && isValidReference(editReference.reference);

  // Changes to fields for adding new Reference

  const handleNewTypeChange = (option: SelectOption<ReferenceType>) => {
    setNewReference((prev) => ({ ...prev, type: option.id }));
  };

  const handleNewReferenceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewReference((prev) => ({ ...prev, reference: e.target.value }));
  };

  const handleAddReference = () => {
    append(newReference);
    // clear input fields
    setNewReference({ type: 'Bibcode', reference: '' });
    (newReferenceInputRef.current as SelectInstance).focus();
  };

  // Changes to fields for existing Reference

  const handleEditReference = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setEditReference({ index, reference: references[index] });
  };

  const handleEditTypeChange = (option: SelectOption<ReferenceType>) => {
    setEditReference((prev) => ({ index: prev.index, reference: { ...prev.reference, type: option.id } }));
  };

  const handleEditReferenceChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditReference((prev) => ({ index: prev.index, reference: { ...prev.reference, reference: e.target.value } }));
  };

  const handleDeleteReference = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    remove(index);
  };

  const handleApplyEditReference = () => {
    update(editReference.index, editReference.reference);
    setEditReference({ index: -1, reference: null });
  };

  const handleCancelEditReference = () => {
    setEditReference({ index: -1, reference: null });
  };

  const handleKeydownEditRef = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editReferenceisValid) {
      handleApplyEditReference();
    }
  };

  const handleKeydownNewRef = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newReferenceIsValid) {
      handleAddReference();
    }
  };
  // Row for adding new Reference
  const newReferenceTableRow = (
    <Tr>
      <Td color="gray.200">{references.length + 1}</Td>
      <Td>
        {isClient && (
          <Select<SelectOption<ReferenceType>>
            options={typeOptions}
            value={newReference?.type ? typeOptions.find((o) => o.id === newReference.type) : null}
            label="new Reference type"
            hideLabel
            id="Reference-type-new"
            stylesTheme="default.sm"
            onChange={handleNewTypeChange}
            menuPortalTarget={document.body}
            ref={newReferenceInputRef}
          />
        )}
      </Td>
      <Td>
        <Input
          size="sm"
          onChange={handleNewReferenceChange}
          value={newReference?.reference ?? ''}
          onKeyDown={handleKeydownNewRef}
        />
      </Td>
      <Td>
        <IconButton
          aria-label="add Reference"
          icon={<CheckIcon />}
          variant="outline"
          colorScheme="green"
          isDisabled={!newReferenceIsValid}
          onClick={handleAddReference}
        />
      </Td>
    </Tr>
  );

  return (
    <Table size="sm">
      <Thead>
        <Tr>
          <Th aria-label="index" w="4%"></Th>
          <Th w="30%">Type</Th>
          <Th>Reference</Th>
          {editable && <Th w="10%">Actions</Th>}
        </Tr>
      </Thead>
      <Tbody>
        {references.map((a, index) =>
          editReference.index === index ? (
            <Tr key={`Reference-${index}`}>
              <Td>{index + 1}</Td>
              <Td>
                <Select<SelectOption<ReferenceType>>
                  options={typeOptions}
                  value={
                    editReference?.reference?.type
                      ? typeOptions.find((o) => o.id === editReference.reference.type)
                      : null
                  }
                  label="Reference type"
                  hideLabel
                  id="Reference-type-edit"
                  stylesTheme="default.sm"
                  onChange={handleEditTypeChange}
                  menuPortalTarget={document.body}
                  autoFocus
                />
              </Td>
              <Td>
                <Input
                  size="sm"
                  onChange={handleEditReferenceChange}
                  value={editReference.reference.reference}
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
                    onClick={handleApplyEditReference}
                    isDisabled={!editReferenceisValid}
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
            <Tr key={`Reference-${index}`}>
              <Td>{index + 1}</Td>
              <Td>{a.type}</Td>
              <Td>{a.reference}</Td>
              {editable && (
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
              )}
            </Tr>
          ),
        )}
        {editable && newReferenceTableRow}
      </Tbody>
    </Table>
  );
};
