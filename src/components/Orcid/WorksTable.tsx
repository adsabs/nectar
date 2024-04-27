import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import {
  Box,
  Center,
  chakra,
  Flex,
  Heading,
  Skeleton,
  Stack,
  Table,
  TableCaption,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VisuallyHidden,
} from '@chakra-ui/react';
import { Select, SelectOption } from '@/components/Select';
import { SimpleLink } from '@/components/SimpleLink';
import { ReactElement, Suspense, useMemo, useState } from 'react';
import { Actions } from './Actions';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { intlFormat, intlFormatDistance } from 'date-fns';
import { isNilOrEmpty, isObject } from 'ramda-adjunct';
import { NASA_SCIX_BRAND_NAME, NASA_SCIX_BRAND_NAME_SHORT, ORCID_ADS_SOURCE_NAME } from '@/config';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { useOrcidProfile } from '@/lib/orcid/useOrcidProfile';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';
import DOMPurify from 'dompurify';
import { PaginationControls } from '@/components';

export const WorksTable = () => {
  return (
    <Stack flexGrow={{ base: 0, lg: 6 }} my="2">
      <Heading as="h2" variant="pageTitle">
        My ORCiD Page
      </Heading>
      <Text>
        <SimpleLink href="/orcid-instructions" newTab display="inline">
          Learn about using ORCiD with NASA SciX
        </SimpleLink>
      </Text>
      <Text>Claims take up to 24 hours to be indexed in SciX</Text>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            fallbackRender={getFallBackAlert({
              label: 'There was an issue fetching your ORCiD profile, please try again.',
            })}
            onReset={reset}
          >
            <Suspense fallback={<TableSkeleton />}>
              <DTable />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </Stack>
  );
};

const TableSkeleton = () => {
  return (
    <Stack>
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
      <Skeleton h="30px" />
    </Stack>
  );
};

const filterOptions: SelectOption[] = [
  { id: 'all_works', value: 'all', label: 'All my papers' },
  { id: 'in_orcid', value: 'in_orcid', label: 'In my ORCiD' },
  { id: 'not_in_orcid', value: 'not_in_orcid', label: 'NOT in ORCiD' },
  { id: 'not_in_scix', value: 'not_in_scix', label: 'NOT in SciX' },
  { id: 'pending', value: 'pending', label: 'Status: Pending' },
  { id: 'verified', value: 'verified', label: 'Status: Verified' },
  { id: 'rejected', value: 'rejected', label: 'Status: Rejected' },
];

const filterEntries = (filter: SelectOption, entries: IOrcidProfileEntry[]) => {
  switch (filter.id) {
    case 'all_works':
      return entries;
    case 'in_orcid':
      return entries.filter(({ status }) => status !== null);
    case 'not_in_orcid':
      return entries.filter(({ status }) => status === null);
    case 'not_in_scix':
      return entries.filter(({ status }) => status === 'not in ADS');
    case 'pending':
      return entries.filter(({ status }) => status === 'pending');
    case 'verified':
      return entries.filter(({ status }) => status === 'verified');
    case 'rejected':
      return entries.filter(({ status }) => status === 'rejected');
    default:
      return entries;
  }
};

const DTable = () => {
  const { profile } = useOrcidProfile(
    {},
    {
      searchOptions: { suspense: true },
      profileOptions: { suspense: true },
    },
  );

  // extract only the values
  const entries = useMemo<IOrcidProfileEntry[]>(() => (isObject(profile) ? Object.values(profile) : []), [profile]);

  const columnHelper = createColumnHelper<IOrcidProfileEntry>();
  const columns = useMemo(() => {
    return [
      columnHelper.accessor('title', {
        cell: (info) => getTitle(info.row.original),
        header: 'Title',
      }),
      columnHelper.accessor('source', {
        cell: (info) => getSource(info.getValue()),
        header: 'Source',
      }),
      columnHelper.accessor('updated', {
        cell: (info) => getUpdated(info.getValue()),
        header: 'Updated',
      }),
      columnHelper.accessor('status', {
        cell: (info) => getStatusTag(info.getValue()),
        header: 'Status',
        enableSorting: false,
      }),
      columnHelper.display({
        cell: (info) => <Actions work={info.row.original} />,
        header: 'Actions',
        enableSorting: false,
      }),
    ];
  }, [columnHelper]);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'updated', desc: true }]);
  const [filter, setFilter] = useState<SelectOption>(filterOptions[0]);
  const filteredEntries = useMemo(() => filterEntries(filter, entries), [filter, entries]);

  const table = useReactTable({
    columns,
    data: filteredEntries,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <>
      <Flex w={['full', '50%']}>
        <Select
          label="Filter"
          id="orcid-works-table-filter"
          options={filterOptions}
          value={filter}
          onChange={setFilter}
          data-testid="orcid-works-filter"
          stylesTheme="default"
        />
      </Flex>
      {filteredEntries.length > 0 ? (
        <Box overflowX={['scroll', 'auto']}>
          <Table>
            <TableCaption>
              <VisuallyHidden>My ORCiD Works Table</VisuallyHidden>
            </TableCaption>
            <Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      cursor={header.column.getCanSort() ? 'pointer' : 'auto'}
                    >
                      <Flex wrap="nowrap">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <chakra.span pl="4">{getSortIcon(header.column.getIsSorted())}</chakra.span>
                      </Flex>
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody>
              {table.getRowModel().rows.map((row) => (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
          <PaginationControls table={table} entries={filteredEntries} />
        </Box>
      ) : (
        <Center>
          <Heading as="h3" size="sm" py="4" data-testid="orcid-works-table-no-results">
            No Results
          </Heading>
        </Center>
      )}
    </>
  );
};

const getSortIcon = (direction: false | 'asc' | 'desc') => {
  if (!direction) {
    return null;
  }
  return direction === 'desc' ? (
    <TriangleDownIcon aria-label="sorted descending" />
  ) : (
    <TriangleUpIcon aria-label="sorted ascending" />
  );
};

const getStatusTag = (status: IOrcidProfileEntry['status']) => {
  switch (status) {
    case 'not in ADS':
      return (
        <Tooltip label="This claim is not currently in SciX">
          <Tag size="sm" colorScheme="blue" whiteSpace="nowrap">
            Not in SciX
          </Tag>
        </Tooltip>
      );
    case 'rejected':
      return (
        <Tooltip label="This claim was rejected, please contact us to find out why">
          <Tag size="sm" colorScheme="red">
            Rejected
          </Tag>
        </Tooltip>
      );
    case 'verified':
      return (
        <Tooltip label="This claim has been verified">
          <Tag size="sm" colorScheme="green">
            Verified
          </Tag>
        </Tooltip>
      );
    case 'pending':
      return (
        <Tooltip label="This claim has been queued and will be processed within 24-48 hours">
          <Tag size="sm" colorScheme="orange">
            Pending
          </Tag>
        </Tooltip>
      );
    default:
      return (
        <Tooltip label="This record was found but is currently unclaimed">
          <Tag size="sm" colorScheme="teal">
            Unclaimed
          </Tag>
        </Tooltip>
      );
  }
};

const getTitle = (work: IOrcidProfileEntry): ReactElement => {
  if (work.status !== 'not in ADS') {
    return (
      <SimpleLink href={`/abs/${encodeURIComponent(work.identifier)}/abstract`}>
        <Text dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(work.title) }} />
      </SimpleLink>
    );
  }
  return <Text>{work.title}</Text>;
};

const getUpdated = (date: string) => {
  const dateStr = new Date(date);
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

const getSource = (sources: IOrcidProfileEntry['source']) => {
  if (isNilOrEmpty(sources)) {
    return 'Provided by publisher';
  }
  return (
    <>
      {sources.map((rawSource) => {
        // shorten the source name if possible
        const source =
          rawSource === ORCID_ADS_SOURCE_NAME ? (
            <Tooltip label={NASA_SCIX_BRAND_NAME}>{NASA_SCIX_BRAND_NAME_SHORT}</Tooltip>
          ) : (
            rawSource
          );
        return (
          <p key={rawSource} style={{ whiteSpace: 'nowrap' }}>
            {source}
          </p>
        );
      })}
    </>
  );
};
