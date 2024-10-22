import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { FormControl, FormLabel, HStack, IconButton, Input, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Select, SelectOption } from '@/components/Select';

import { ChangeEvent, KeyboardEvent, MouseEvent, useRef, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { SelectInstance } from 'react-select';
import { FormValues } from './types';
import { IResourceUrl, ResourceUrlType, resourceUrlTypes } from '@/lib/useGetResourceLinks';
import { useIsClient } from '@/lib/useIsClient';

export const UrlsField = () => {
  return (
    <FormControl>
      <FormLabel>URLs</FormLabel>
      <UrlsTable editable />
    </FormControl>
  );
};

const typeOptions: SelectOption<ResourceUrlType>[] = resourceUrlTypes.map((t) => ({
  id: t,
  label: t as string,
  value: t as string,
}));

export const UrlsTable = ({ editable }: { editable: boolean }) => {
  const isClient = useIsClient();

  const {
    fields: urls,
    append,
    remove,
    update,
  } = useFieldArray<FormValues, 'urls'>({
    name: 'urls',
  });

  // New row being added
  const [newUrl, setNewUrl] = useState<IResourceUrl>({ type: 'arXiv', url: '' });

  // Existing row being edited
  const [editUrl, setEditUrl] = useState<{ index: number; url: IResourceUrl }>({
    index: -1,
    url: null,
  });

  const newURLTypeInputRef = useRef<never>();

  /**
   * Checks if the provided URL is valid and uses an allowed protocol.
   *
   * This function takes an object containing a URL and a type,
   * and verifies if the URL is valid and if it uses one of the allowed protocols (http or https).
   *
   * @param {Object} param - The input object containing the URL and type.
   * @param {string} param.url - The URL to be validated.
   * @param {string} param.type - The type associated with the URL.
   * @returns {boolean} Returns true if the URL is valid and uses an allowed protocol, otherwise false.
   */
  const isValidUrl = ({ url, type }: IResourceUrl): boolean => {
    if (!url || !type) {
      return false;
    }

    const VALID_PROTOCOLS = ['http:', 'https:'];

    try {
      const testUrl = new URL(url);
      return VALID_PROTOCOLS.includes(testUrl.protocol);
    } catch {
      return false;
    }
  };

  const newUrlIsValid = !!newUrl && isValidUrl(newUrl);

  const editUrlisValid = editUrl.url && isValidUrl(editUrl.url);

  // Changes to fields for adding new url

  const handleNewTypeChange = (option: SelectOption<ResourceUrlType>) => {
    setNewUrl((prev) => ({ ...prev, type: option.id }));
  };

  const handleNewUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUrl((prev) => ({ ...prev, url: e.target.value }));
  };

  const handleAddUrl = () => {
    append(newUrl);
    // clear input fields
    setNewUrl({ type: 'arXiv', url: '' });
    (newURLTypeInputRef.current as SelectInstance).focus();
  };

  // Changes to fields for existing url

  const handleEditUrl = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setEditUrl({ index, url: urls[index] });
  };

  const handleEditTypeChange = (option: SelectOption<ResourceUrlType>) => {
    setEditUrl((prev) => ({ index: prev.index, url: { ...prev.url, type: option.id } }));
  };

  const handleEditUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditUrl((prev) => ({ index: prev.index, url: { ...prev.url, url: e.target.value } }));
  };

  const handleDeleteUrl = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    remove(index);
  };

  const handleApplyEditUrl = () => {
    update(editUrl.index, editUrl.url);
    setEditUrl({ index: -1, url: null });
  };

  const handleCancelEditUrl = () => {
    setEditUrl({ index: -1, url: null });
  };

  const handleKeydownEditUrl = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editUrlisValid) {
      handleApplyEditUrl();
    }
  };

  const handleKeydownNewUrl = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newUrlIsValid) {
      handleAddUrl();
    }
  };

  // Row for adding new url
  const newUrlTableRow = (
    <Tr>
      <Td color="gray.200">{urls.length + 1}</Td>
      <Td>
        {isClient && (
          <Select<SelectOption<ResourceUrlType>>
            options={typeOptions}
            value={newUrl?.type ? typeOptions.find((o) => o.id === newUrl.type) : null}
            label="new url type"
            hideLabel
            id="url-type-new"
            stylesTheme="default.sm"
            onChange={handleNewTypeChange}
            menuPortalTarget={document.body}
            ref={newURLTypeInputRef}
          />
        )}
      </Td>
      <Td>
        <Input size="sm" onChange={handleNewUrlChange} value={newUrl?.url ?? ''} onKeyDown={handleKeydownNewUrl} />
      </Td>
      <Td>
        <IconButton
          aria-label="add url"
          icon={<CheckIcon />}
          variant="outline"
          colorScheme="green"
          isDisabled={!newUrlIsValid}
          onClick={handleAddUrl}
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
          <Th>URL</Th>
          {editable && <Th w="10%">Actions</Th>}
        </Tr>
      </Thead>
      <Tbody>
        {urls.map((a, index) =>
          editUrl.index === index ? (
            <Tr key={`url-${index}`}>
              <Td>{index + 1}</Td>
              <Td>
                <Select<SelectOption<ResourceUrlType>>
                  options={typeOptions}
                  value={editUrl?.url?.type ? typeOptions.find((o) => o.id === editUrl.url.type) : null}
                  label="url type"
                  hideLabel
                  id="url-type-edit"
                  stylesTheme="default.sm"
                  onChange={handleEditTypeChange}
                  menuPortalTarget={document.body}
                  autoFocus
                />
              </Td>
              <Td>
                <Input
                  size="sm"
                  onChange={handleEditUrlChange}
                  value={editUrl.url.url}
                  onKeyDown={handleKeydownEditUrl}
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
                    onClick={handleApplyEditUrl}
                    isDisabled={!editUrlisValid}
                  />
                  <IconButton
                    aria-label="cancel"
                    icon={<CloseIcon />}
                    variant="outline"
                    colorScheme="red"
                    data-index={index}
                    onClick={handleCancelEditUrl}
                  />
                </HStack>
              </Td>
            </Tr>
          ) : (
            <Tr key={`url-${index}`}>
              <Td>{index + 1}</Td>
              <Td>{a.type}</Td>
              <Td>{a.url}</Td>
              {editable && (
                <Td>
                  <HStack>
                    <IconButton
                      aria-label="edit"
                      icon={<EditIcon />}
                      variant="outline"
                      colorScheme="blue"
                      data-index={index}
                      onClick={handleEditUrl}
                    />
                    <IconButton
                      aria-label="delete"
                      icon={<DeleteIcon />}
                      variant="outline"
                      colorScheme="red"
                      data-index={index}
                      onClick={handleDeleteUrl}
                    />
                  </HStack>
                </Td>
              )}
            </Tr>
          ),
        )}
        {editable && newUrlTableRow}
      </Tbody>
    </Table>
  );
};
