import { CheckIcon, CloseIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { Tr, Td, Input, IconButton, TableContainer, Table, Thead, Th, Tbody, HStack } from '@chakra-ui/react';
import { Select, SelectOption } from '@components/Select';
import { useIsClient } from '@lib';
import { noop } from '@utils';
import { useState, ChangeEvent, MouseEvent } from 'react';
import { IUrl, UrlType, urlTypes } from './types';

const typeOptions: SelectOption<UrlType>[] = urlTypes.map((t) => ({
  id: t,
  label: t as string,
  value: t as string,
}));

export const URLTable = ({
  urls,
  onAddUrl = noop,
  onDeleteUrl = noop,
  onUpdateUrl = noop,
  editable,
}: {
  urls: IUrl[];
  onAddUrl?: (author: IUrl) => void;
  onDeleteUrl?: (index: number) => void;
  onUpdateUrl?: (index: number, url: IUrl) => void;
  editable: boolean;
}) => {
  const isClient = useIsClient();

  // New row being added
  const [newUrl, setNewUrl] = useState<IUrl>(null);

  // Existing row being edited
  const [editUrl, setEditUrl] = useState<{ index: number; url: IUrl }>({
    index: -1,
    url: null,
  });

  const isValidUrl = ({ url, type }: IUrl) => {
    if (!url || !type) {
      return false;
    }

    let test;
    try {
      test = new URL(url);
    } catch (_) {
      return false;
    }

    return test.protocol === 'http:' || test.protocol === 'https:';
  };

  const newUrlIsValid = !!newUrl && isValidUrl(newUrl);

  const editUrlisValid = editUrl.url && isValidUrl(editUrl.url);

  // Changes to fields for adding new url

  const handleNewTypeChange = (option: SelectOption<UrlType>) => {
    setNewUrl((prev) => ({ ...prev, type: option.id }));
  };

  const handleNewUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewUrl((prev) => ({ ...prev, url: e.target.value }));
  };

  const handleAddUrl = () => {
    onAddUrl(newUrl);
    // clear input fields
    setNewUrl(null);
  };

  // Changes to fields for existing url

  const handleEditUrl = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setEditUrl({ index, url: urls[index] });
  };

  const handleEditTypeChange = (option: SelectOption<UrlType>) => {
    setEditUrl((prev) => ({ index: prev.index, url: { ...prev.url, type: option.id } }));
  };

  const handleEditUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditUrl((prev) => ({ index: prev.index, url: { ...prev.url, url: e.target.value } }));
  };

  const handleDeleteUrl = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    onDeleteUrl(index);
  };

  const handleApplyEditUrl = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    onUpdateUrl(index, editUrl.url);
    setEditUrl({ index: -1, url: null });
  };

  const handleCancelEditUrl = () => {
    setEditUrl({ index: -1, url: null });
  };

  // Row for adding new url
  const newUrlTableRow = (
    <Tr>
      <Td color="gray.200">{urls.length + 1}</Td>
      <Td>
        {isClient && (
          <Select<SelectOption<UrlType>>
            options={typeOptions}
            value={newUrl?.type ? typeOptions.find((o) => o.id === newUrl.type) : null}
            label="new url type"
            hideLabel
            id="url-type-new"
            stylesTheme="default.sm"
            onChange={handleNewTypeChange}
            menuPortalTarget={document.body}
          />
        )}
      </Td>
      <Td>
        <Input size="sm" onChange={handleNewUrlChange} value={newUrl?.url ?? ''} />
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
    <TableContainer>
      <Table size="sm">
        <Thead>
          <Th aria-label="index" w="4%"></Th>
          <Th w="30%">Type</Th>
          <Th>URL</Th>
          {editable && <Th w="10%">Actions</Th>}
        </Thead>
        <Tbody>
          {urls.map((a, index) =>
            editUrl.index === index ? (
              <Tr key={`url-${index}`}>
                <Td>{index + 1}</Td>
                <Td>
                  <Select<SelectOption<UrlType>>
                    options={typeOptions}
                    value={editUrl?.url?.type ? typeOptions.find((o) => o.id === editUrl.url.type) : null}
                    label="url type"
                    hideLabel
                    id="url-type-edit"
                    stylesTheme="default.sm"
                    onChange={handleEditTypeChange}
                    menuPortalTarget={document.body}
                  />
                </Td>
                <Td>
                  <Input size="sm" onChange={handleEditUrlChange} value={editUrl.url.url} />
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
    </TableContainer>
  );
};
