import { ILibraryMetadata, LibraryIdentifier, useDeleteLibrary } from '@api';
import {
  ChevronDownIcon,
  LockIcon,
  SettingsIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  UnlockIcon,
  UpDownIcon,
} from '@chakra-ui/icons';
import {
  Table,
  TableProps,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Flex,
  Text,
  Tooltip,
  Center,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useToast,
  Button,
  useBreakpoint,
  Box,
  IconButton,
} from '@chakra-ui/react';
import { ControlledPaginationControls } from '@components';
import { CustomInfoMessage } from '@components/Feedbacks';
import { UserGroupIcon, UserIcon } from '@heroicons/react/24/solid';
import { NumPerPageType } from '@types';
import { noop, parseAPIError } from '@utils';
import { intlFormat, intlFormatDistance } from 'date-fns';
import { useRouter } from 'next/router';
import { uniq } from 'ramda';
import { Fragment, MouseEvent, useMemo } from 'react';
import { DeleteLibrary } from './DeleteLibrary';

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

// hide columns for small display
const hideColsSmallDisplay: Column[] = ['public', 'num_users', 'permission', 'date_last_modified'];

export interface ILibraryListTableSort {
  col: keyof ILibraryMetadata;
  dir: SortDirection;
}

export interface ILibraryListTableProps extends TableProps {
  libraries: ILibraryMetadata[];
  entries: number;
  sort: ILibraryListTableSort;
  pageSize: NumPerPageType;
  pageIndex: number;
  showIndex?: boolean;
  showSettings?: boolean;
  hideCols?: Column[];
  showDescription?: boolean;
  onChangeSort: (sort: ILibraryListTableSort) => void;
  onChangePageIndex: (index: number) => void;
  onChangePageSize: (size: NumPerPageType) => void;
  onLibrarySelect: (id: LibraryIdentifier) => void;
  onUpdate?: () => void;
}

export const LibraryListTable = (props: ILibraryListTableProps) => {
  const {
    libraries,
    entries,
    sort,
    pageSize,
    pageIndex,
    showIndex = true,
    showSettings = true,
    hideCols = [],
    showDescription = true,
    onChangeSort,
    onChangePageIndex,
    onChangePageSize,
    onLibrarySelect,
    onUpdate = noop,
    ...tableProps
  } = props;

  const router = useRouter();

  const breakpoint = useBreakpoint();

  const isMobile = ['base', 'xs', 'sm'].includes(breakpoint, 0);

  const allHiddenCols = useMemo(() => {
    return isMobile ? uniq([...hideColsSmallDisplay, ...hideCols]) : [...hideCols];
  }, [isMobile]);

  const { mutate: deleteLibrary } = useDeleteLibrary();

  const toast = useToast({
    duration: 2000,
  });

  const handleSettings = (id: LibraryIdentifier) => {
    void router.push({ pathname: `/user/libraries/${id}/settings`, query: { from: 'landing' } });
  };

  const handleDeleteLibrary = (id: LibraryIdentifier) => {
    deleteLibrary(
      { id },
      {
        onSettled(data, error) {
          if (error) {
            toast({
              status: 'error',
              title: 'Error deleting library',
              description: parseAPIError(error),
            });
          } else {
            toast({
              status: 'success',
              title: 'Library deleted',
            });
            onUpdate();
          }
        },
      },
    );
  };

  return (
    <>
      {!libraries ? (
        <CustomInfoMessage status="error" title="Unable to load libraries" />
      ) : libraries.length === 0 ? (
        <CustomInfoMessage status="info" title="No libraries found" />
      ) : (
        <Box my={4}>
          <Table variant="simple" {...tableProps} data-testid="libraries-table">
            <Thead>
              <Tr>
                {showIndex && !isMobile && <Th aria-label="index"></Th>}
                {columns.map((column) => (
                  <Fragment key={`col-${column.id}`}>
                    {allHiddenCols.indexOf(column.id) === -1 && (
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
                {showSettings && !isMobile && <Th>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {libraries?.map(
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
                    {showIndex && !isMobile && <Td>{pageSize * pageIndex + index + 1}</Td>}
                    {allHiddenCols.indexOf('public') === -1 && (
                      <Td>
                        {isPublic ? (
                          <Tooltip label="Public">
                            <IconButton
                              icon={<LockIcon />}
                              color="green.500"
                              aria-label="public"
                              variant="ghost"
                              w={3}
                              h={3}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip label="Private">
                            <IconButton
                              icon={<UnlockIcon />}
                              color="gray.600"
                              aria-label="private"
                              variant="ghost"
                              w={3}
                              h={3}
                            />
                          </Tooltip>
                        )}
                      </Td>
                    )}
                    {allHiddenCols.indexOf('num_users') === -1 && (
                      <Td>
                        {num_users === 1 ? (
                          <Tooltip label="No collaborators">
                            <IconButton
                              as={UserIcon}
                              aria-label="no collaborators"
                              color="gray.600"
                              w={4}
                              h={4}
                              variant="ghost"
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip label={`${num_users} collaborators`}>
                            <IconButton
                              as={UserGroupIcon}
                              aria-label="has collaborators"
                              color="green.500"
                              w={4}
                              h={4}
                              variant="ghost"
                            />
                          </Tooltip>
                        )}
                      </Td>
                    )}
                    {allHiddenCols.indexOf('name') === -1 && (
                      <Td>
                        <Text fontWeight="bold">{name}</Text>
                        {showDescription && <Text>{description}</Text>}
                      </Td>
                    )}
                    {allHiddenCols.indexOf('num_documents') === -1 && <Td>{num_documents}</Td>}
                    {allHiddenCols.indexOf('owner') === -1 && <Td>{owner}</Td>}
                    {allHiddenCols.indexOf('permission') === -1 && <Td>{permission}</Td>}
                    {allHiddenCols.indexOf('date_last_modified') === -1 && (
                      <Td>
                        <LastModified date={date_last_modified} />
                      </Td>
                    )}
                    {showSettings && !isMobile && (
                      <Td>
                        <Center>
                          <Action
                            onDelete={() => handleDeleteLibrary(id)}
                            onSetting={() => handleSettings(id)}
                            disableDelete={permission !== 'owner'}
                          />
                        </Center>
                      </Td>
                    )}
                  </Tr>
                ),
              )}
            </Tbody>
          </Table>
          <ControlledPaginationControls
            entries={entries}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onChangePageSize={onChangePageSize}
            onChangePageIndex={onChangePageIndex}
            my={4}
          />
        </Box>
      )}
    </>
  );
};

const LastModified = ({ date }: { date: string }) => {
  const dateStr = new Date(`${date.match(/[+]([0-9]){2}:([0-9]){2}$/) ? date : `${date}+00:00`}`); // date string here is missing the timezone, add it or the time is wrong
  const formatted = intlFormatDistance(dateStr, new Date());
  return (
    <Tooltip
      label={intlFormat(dateStr, {
        hour12: false,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}
    >
      {formatted}
    </Tooltip>
  );
};

const Action = ({
  onDelete,
  onSetting,
  disableDelete = false,
}: {
  onDelete: () => void;
  onSetting: () => void;
  disableDelete?: boolean;
}) => {
  const handleSettings = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSetting();
  };

  return (
    <Center>
      <Menu>
        <MenuButton
          as={Button}
          variant="outline"
          rightIcon={<ChevronDownIcon />}
          onClick={(e) => e.stopPropagation()}
          children={<SettingsIcon />}
        />
        <MenuList>
          <MenuItem onClick={handleSettings}>Settings</MenuItem>
          <DeleteLibrary onDelete={onDelete} format="menuitem" isDisabled={disableDelete} />
        </MenuList>
      </Menu>
    </Center>
  );
};
