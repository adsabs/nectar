import { ILibraryMetadata, LibraryIdentifier } from '@api';
import { LockIcon, TriangleDownIcon, TriangleUpIcon, UnlockIcon, UpDownIcon } from '@chakra-ui/icons';
import { Icon, Table, TableProps, Tbody, Td, Th, Thead, Tr, Flex, Text, Tooltip } from '@chakra-ui/react';
import { ControlledPaginationControls } from '@components';
import { CustomInfoMessage } from '@components/Feedbacks';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/solid';
import { Fragment } from 'react';

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
    sortable: false, // TODO: true
  },
  {
    id: 'num_documents',
    heading: 'Papers',
    sortable: false, // TODO: true
  },
  {
    id: 'owner',
    heading: 'Owner',
    sortable: false, // TODO: true
  },
  {
    id: 'permission',
    heading: 'Permission',
    sortable: false, // TODO: true
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
  showIndex?: boolean;
  hideCols?: Column[];
  showDescription?: boolean;
  onChangeSort: (sort: ILibraryListTableSort) => void;
  onChangePageIndex: (index: number) => void;
  onChangePageSize: (size: number) => void;
  onLibrarySelect: (id: LibraryIdentifier) => void;
}

export const LibraryListTable = (props: ILibraryListTableProps) => {
  const {
    libraries,
    entries,
    sort,
    pageSize,
    pageIndex,
    showIndex = true,
    hideCols = [],
    showDescription = true,
    onChangeSort,
    onChangePageIndex,
    onChangePageSize,
    onLibrarySelect,
    ...tableProps
  } = props;

  return (
    <>
      {libraries?.length === 0 ? (
        <CustomInfoMessage status="info" title="No libraries found" />
      ) : (
        <Table variant="simple" {...tableProps}>
          <Thead>
            <Tr>
              {showIndex && <Th aria-label="index"></Th>}
              {columns.map((column) => (
                <Fragment key={`col-${column.id}`}>
                  {hideCols.indexOf(column.id) === -1 && (
                    <Th aria-label={column.heading} cursor={column.sortable ? 'pointer' : 'default'}>
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
                  )}
                </Fragment>
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
                  {showIndex && <Td>{pageSize * pageIndex + index + 1}</Td>}
                  {hideCols.indexOf('public') === -1 && (
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
                  )}
                  {hideCols.indexOf('num_users') === -1 && (
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
                  )}
                  {hideCols.indexOf('name') === -1 && (
                    <Td>
                      <Text fontWeight="bold">{name}</Text>
                      {showDescription && <Text>{description}</Text>}
                    </Td>
                  )}
                  {hideCols.indexOf('num_documents') === -1 && <Td>{num_documents}</Td>}
                  {hideCols.indexOf('owner') === -1 && <Td>{owner}</Td>}
                  {hideCols.indexOf('permission') === -1 && <Td>{permission}</Td>}
                  {hideCols.indexOf('date_last_modified') === -1 && <Td>{date_last_modified}</Td>}
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
