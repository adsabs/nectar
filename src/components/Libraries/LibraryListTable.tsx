import { LockIcon, TriangleDownIcon, TriangleUpIcon, UnlockIcon, UpDownIcon } from '@chakra-ui/icons';
import { Icon, Table, TableProps, Tbody, Td, Th, Thead, Tr, Flex, Text, Tooltip, Checkbox } from '@chakra-ui/react';
import { ControlledPaginationControls } from '@components';
import { CustomInfoMessage } from '@components/Feedbacks';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/solid';
import { ChangeEvent, useState } from 'react';
import { LibraryMeta } from './types';

type Column = keyof LibraryMeta | 'index';
type SortDirection = 'asc' | 'desc';

const columns: { id: Column | 'index'; heading: string; sortable: boolean }[] = [
  {
    id: 'index',
    heading: '',
    sortable: false,
  },
  {
    id: 'visibility',
    heading: '',
    sortable: false,
  },
  {
    id: 'collaborators',
    heading: '',
    sortable: false,
  },
  {
    id: 'name',
    heading: 'Library',
    sortable: true,
  },
  {
    id: 'papers',
    heading: 'Papers',
    sortable: true,
  },
  {
    id: 'owner',
    heading: 'Owner',
    sortable: true,
  },
  {
    id: 'permission',
    heading: 'Permission',
    sortable: true,
  },
  {
    id: 'lastModified',
    heading: 'Last Modified',
    sortable: true,
  },
];

export interface ILibraryListTableSort {
  col: Column;
  dir: SortDirection;
}

export interface ILibraryListTableProps extends TableProps {
  libraries: LibraryMeta[];
  entries: number;
  selected: string[];
  sort: ILibraryListTableSort;
  pageSize: number;
  pageIndex: number;
  onChangeSort: (sort: ILibraryListTableSort) => void;
  onChangePageIndex: (index: number) => void;
  onChangePageSize: (size: number) => void;
  onLibrarySelect: (id: string) => void;
  onSetSelected: (ids: string[]) => void;
}

export const LibraryListTable = (props: ILibraryListTableProps) => {
  const {
    libraries,
    entries,
    selected,
    sort,
    pageSize,
    pageIndex,
    onChangeSort,
    onChangePageIndex,
    onChangePageSize,
    onLibrarySelect,
    onSetSelected,
    ...tableProps
  } = props;

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) {
      onSetSelected([]);
    } else {
      onSetSelected(libraries.map((l) => l.id));
    }
  };

  const handleSelecbLib = (id: string, checked: boolean) => {
    if (!checked) {
      onSetSelected(selected.filter((l) => l !== id));
    } else {
      onSetSelected([...selected, id]);
    }
  };

  return (
    <>
      {libraries.length === 0 ? (
        <CustomInfoMessage status="info" title="No libraries found" />
      ) : (
        <Table variant="simple" {...tableProps}>
          <Thead>
            <Tr>
              <Th>
                {
                  <Checkbox
                    aria-label="Select/Deselect all libraries"
                    onChange={handleSelectAll}
                    isChecked={selected.length === entries}
                    isIndeterminate={selected.length > 0 && selected.length < entries}
                  />
                }
              </Th>
              {columns.map((column) => (
                <Th key={column.id} aria-label={column.heading} cursor={column.sortable ? 'pointer' : 'default'}>
                  {sort.col !== column.id ? (
                    column.sortable ? (
                      <Flex alignItems="center" onClick={() => onChangeSort({ col: column.id, dir: 'asc' })}>
                        {column.heading}
                        <UpDownIcon m={2} />
                      </Flex>
                    ) : (
                      <>{column.heading}</>
                    )
                  ) : (
                    <>
                      {sort.dir === 'desc' ? (
                        <Flex alignItems="center" onClick={() => onChangeSort({ col: column.id, dir: 'asc' })}>
                          {column.heading}
                          <TriangleDownIcon m={2} />
                        </Flex>
                      ) : (
                        <Flex alignItems="center" onClick={() => onChangeSort({ col: column.id, dir: 'desc' })}>
                          {column.heading}
                          <TriangleUpIcon m={2} />
                        </Flex>
                      )}
                    </>
                  )}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {libraries.map(
              (
                { id, visibility, collaborators, name, description, papers, owner, permission, lastModified },
                index,
              ) => (
                <Tr
                  key={id}
                  cursor="pointer"
                  _hover={{ backgroundColor: 'blue.50' }}
                  onClick={() => onLibrarySelect(id)}
                >
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label={`Select/Deselect library "${name}"`}
                      data-lid={id}
                      onChange={(e) => handleSelecbLib(id, e.target.checked)}
                      isChecked={selected.includes(id)}
                    />
                  </Td>
                  <Td>{index + 1}</Td>
                  <Td>
                    {visibility === 'public' ? (
                      <Tooltip label="Public">
                        <UnlockIcon color="green.500" aria-label="public" />
                      </Tooltip>
                    ) : (
                      <Tooltip label="Private">
                        <LockIcon aria-label="private" />
                      </Tooltip>
                    )}
                  </Td>
                  <Td>
                    {collaborators === 0 ? (
                      <Tooltip label="No collaborators">
                        <Icon as={UserIcon} aria-label="no collaborators" w={4} h={4} />
                      </Tooltip>
                    ) : (
                      <Tooltip label={`${collaborators} collaborators`}>
                        <Icon as={UserGroupIcon} aria-label="has collaborators" color="green.500" w={4} h={4} />
                      </Tooltip>
                    )}
                  </Td>
                  <Td>
                    <Text fontWeight="bold">{name}</Text>
                    <Text>{description}</Text>
                  </Td>
                  <Td>{papers}</Td>
                  <Td>{owner}</Td>
                  <Td>{permission}</Td>
                  <Td>{lastModified}</Td>
                </Tr>
              ),
            )}
          </Tbody>
        </Table>
      )}
      <ControlledPaginationControls
        entries={entries}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onChangePageSize={onChangePageSize}
        onChangePageIndex={onChangePageIndex}
        mt={2}
      />
    </>
  );
};
