import { ILibraryMetadata } from '@api';
import { LockIcon, TriangleDownIcon, TriangleUpIcon, UnlockIcon, UpDownIcon } from '@chakra-ui/icons';
import { Icon, Table, TableProps, Tbody, Td, Th, Thead, Tr, Flex, Text, Tooltip } from '@chakra-ui/react';
import { ControlledPaginationControls } from '@components';
import { CustomInfoMessage } from '@components/Feedbacks';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/solid';

type Column = keyof ILibraryMetadata;
type SortDirection = 'asc' | 'desc';

const columns: { id: Column; heading: string; sortable: boolean }[] = [
  {
    id: 'public',
    heading: '',
    sortable: false,
  },
  {
    id: 'num_users',
    heading: '',
    sortable: false,
  },
  {
    id: 'name',
    heading: 'Library',
    sortable: true,
  },
  {
    id: 'num_documents',
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
    id: 'date_last_modified',
    heading: 'Last Modified',
    sortable: true,
  },
];

export interface ILibraryListTableSort {
  col: keyof ILibraryMetadata;
  dir: SortDirection;
}

export interface ILibraryListTableProps extends TableProps {
  libraries: ILibraryMetadata[];
  entries: number;
  sort: ILibraryListTableSort;
  pageSize: number;
  pageIndex: number;
  onChangeSort: (sort: ILibraryListTableSort) => void;
  onChangePageIndex: (index: number) => void;
  onChangePageSize: (size: number) => void;
  onLibrarySelect: (id: string) => void;
}

export const LibraryListTable = (props: ILibraryListTableProps) => {
  const {
    libraries,
    entries,
    sort,
    pageSize,
    pageIndex,
    onChangeSort,
    onChangePageIndex,
    onChangePageSize,
    onLibrarySelect,
    ...tableProps
  } = props;

  return (
    <>
      {libraries.length === 0 ? (
        <CustomInfoMessage status="info" title="No libraries found" />
      ) : (
        <Table variant="simple" {...tableProps}>
          <Thead>
            <Tr>
              <Th aria-label="index"></Th>
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
                {
                  id,
                  public: isPublic,
                  num_users,
                  name,
                  description,
                  num_documents,
                  owner,
                  permission,
                  date_last_modified,
                },
                index,
              ) => (
                <Tr
                  key={id}
                  cursor="pointer"
                  _hover={{ backgroundColor: 'blue.50' }}
                  onClick={() => onLibrarySelect(id)}
                >
                  <Td>{pageSize * pageIndex + index + 1}</Td>
                  <Td>
                    {isPublic ? (
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
                    {num_users === 1 ? (
                      <Tooltip label="No collaborators">
                        <Icon as={UserIcon} aria-label="no collaborators" w={4} h={4} />
                      </Tooltip>
                    ) : (
                      <Tooltip label={`${num_users} collaborators`}>
                        <Icon as={UserGroupIcon} aria-label="has collaborators" color="green.500" w={4} h={4} />
                      </Tooltip>
                    )}
                  </Td>
                  <Td>
                    <Text fontWeight="bold">{name}</Text>
                    <Text>{description}</Text>
                  </Td>
                  <Td>{num_documents}</Td>
                  <Td>{owner}</Td>
                  <Td>{permission}</Td>
                  <Td>{date_last_modified}</Td>
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
