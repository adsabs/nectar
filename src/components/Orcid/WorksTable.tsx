import { getSearchParams, useSearch } from '@api';
import { IOrcidProfile } from '@api/orcid/types';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { ChevronDownIcon, ChevronUpIcon, UpDownIcon } from '@chakra-ui/icons';
import { Stack, Heading, Table, Thead, Tr, Th, Tbody, Td, Text, Box, useToast, IconButton } from '@chakra-ui/react';
import { Select, SelectOption } from '@components/Select';
import { SimpleLink } from '@components/SimpleLink';
import { useOrcid } from '@lib/orcid/useOrcid';
import { useRemoveWorks } from '@lib/orcid/useRemoveWorks';
import { useEffect, useMemo, useState } from 'react';
import { Actions } from './Actions';
import { isInSciX } from './Utils';

// TODO: pagination

const filterOptions: SelectOption[] = [
  { id: 'all', value: 'all', label: 'All my papers' },
  { id: 'orcid', value: 'all', label: 'In my ORCiD' },
  { id: 'not-orcid', value: 'all', label: 'Not in my ORCiD' },
  { id: 'not-scix', value: 'all', label: 'Not in SciX' },
];

enum Direction {
  ASC = 'ascending',
  DESC = 'descending',
}

type SortField = 'title' | 'updated' | 'status';

// get sort function
const compareFn = (sortByField: SortField, direction: Direction) => {
  return (w1: IOrcidProfileEntry, w2: IOrcidProfileEntry) => {
    if (direction === Direction.ASC) {
      return w1[sortByField] < w2[sortByField] ? -1 : 1;
    } else {
      return w1[sortByField] < w2[sortByField] ? 1 : -1;
    }
  };
};

export const WorksTable = () => {
  const toast = useToast({
    duration: 2000,
  });

  const { user, profile } = useOrcid();

  const allWorks: IOrcidProfile = profile;

  // All papers with matching orcid
  const { data } = useSearch(
    getSearchParams({ q: `orcid:${user?.orcid}`, rows: 500, fl: ['title', 'identifier', 'pubdate'] }),
    {
      enabled: typeof user?.orcid === 'string',
    },
  );

  const allPapers = data ? data.docs : [];

  allPapers.forEach((doc) => {
    // if none of its identifiers is in claimed, add it to all works
    if (doc.identifier.filter((identifier) => identifier in allWorks)) {
      allWorks[doc.identifier[0]] = {
        identifier: doc.identifier[0],
        status: null,
        title: doc.title[0],
        pubyear: null,
        pubmonth: null,
        updated: null,
        putcode: null,
        source: ['publisher'],
      };
    }
  });

  const [selectedFilter, setSelectedFilter] = useState(filterOptions[0]);

  // sorting
  const [sortBy, setSortBy] = useState<{ field: SortField; dir: Direction }>({
    field: 'title',
    dir: Direction.ASC,
  });

  // displayed works after filter and sorting applied
  const displayedWorks = useMemo(() => {
    const allWorksList = allWorks ? Object.values(allWorks) : [];
    switch (selectedFilter.id) {
      case 'all':
        return allWorksList.sort(compareFn(sortBy.field, sortBy.dir));
      case 'orcid':
        return allWorksList.filter((w) => w.status !== null).sort(compareFn(sortBy.field, sortBy.dir));
      case 'not-orcid':
        return allWorksList.filter((w) => w.status === null).sort(compareFn(sortBy.field, sortBy.dir));
      case 'not-scix':
        return allWorksList
          .filter((w) => w.source.indexOf('NASA Astrophysics Data System') === -1)
          .sort(compareFn(sortBy.field, sortBy.dir));
    }
  }, [allWorks, selectedFilter, sortBy]);

  // TODO: enable add claim
  // TODO: enable sync
  // enable delete claim
  const { removeWorks, isSuccess: removeWorksSuccessful, error: removeWorksError } = useRemoveWorks();

  // TODO: adding claim from scix
  // TODO: sync to orcid
  // removing claim from scix
  useEffect(() => {
    if (removeWorksSuccessful) {
      toast({
        status: 'success',
        title: 'Successfully submitted claim request',
      });
    }
    if (removeWorksError) {
      toast({
        status: 'error',
        title: removeWorksError.message,
      });
    }
  }, [removeWorksSuccessful, removeWorksError]);

  const handleFilterOptionsSelected = (option: SelectOption) => {
    setSelectedFilter(option);
  };

  // TODO: add claim handler
  const handleAddClaim = () => {
    return;
  };

  // TODO: sync to orcid handler
  const handleSyncToOrcid = () => {
    return;
  };

  // Delete claim handler
  const handleDeleteClaim = (putcode: IOrcidProfileEntry['putcode']) => {
    removeWorks([typeof putcode === 'number' ? putcode.toString() : putcode]);
  };

  // sort change handler
  const handleSortChange = (field: SortField, dir: Direction) => {
    setSortBy({ field, dir });
  };

  return (
    <Stack flexGrow={{ base: 0, lg: 6 }}>
      <Heading as="h2" variant="pageTitle">
        My ORCiD Page
      </Heading>
      <SimpleLink href="/orcid-instructions" newTab>
        Learn about using ORCiD with NASA SciX
      </SimpleLink>
      <Text>Claims take up to 24 hours to be indexed in SciX</Text>
      {!user && !profile && <>Loading...</>}
      <Box w="350px">
        <Select
          options={filterOptions}
          value={selectedFilter}
          label="Filter"
          id="orcid-filter-options"
          stylesTheme="default"
          onChange={handleFilterOptionsSelected}
        />
      </Box>
      {user && profile ? (
        displayedWorks.length === 0 ? (
          <Text>No papers found</Text>
        ) : (
          <>
            <Table aria-label={`Works sorted by ${sortBy.field} ${sortBy.dir}`}>
              <Thead>
                <Tr>
                  <Th w="30%">
                    Title
                    <IconButton
                      aria-label="sort by title"
                      icon={
                        sortBy.field !== 'title' ? (
                          <UpDownIcon onClick={() => handleSortChange('title', Direction.ASC)} />
                        ) : sortBy.dir === Direction.ASC ? (
                          <ChevronUpIcon onClick={() => handleSortChange('title', Direction.DESC)} />
                        ) : (
                          <ChevronDownIcon onClick={() => handleSortChange('title', Direction.ASC)} />
                        )
                      }
                      size="xs"
                      ml={5}
                      variant="ghost"
                    />
                  </Th>
                  <Th w="25%">Claimed By</Th>
                  <Th w="15%">
                    Updated
                    <IconButton
                      aria-label="sort by date"
                      icon={
                        sortBy.field !== 'updated' ? (
                          <UpDownIcon onClick={() => handleSortChange('updated', Direction.ASC)} />
                        ) : sortBy.dir === Direction.ASC ? (
                          <ChevronUpIcon onClick={() => handleSortChange('updated', Direction.DESC)} />
                        ) : (
                          <ChevronDownIcon onClick={() => handleSortChange('updated', Direction.ASC)} />
                        )
                      }
                      size="xs"
                      ml={5}
                      variant="ghost"
                    />
                  </Th>
                  <Th>
                    Status
                    <IconButton
                      aria-label="sort by status"
                      icon={
                        sortBy.field !== 'status' ? (
                          <UpDownIcon onClick={() => handleSortChange('status', Direction.ASC)} />
                        ) : sortBy.dir === Direction.ASC ? (
                          <ChevronUpIcon onClick={() => handleSortChange('status', Direction.DESC)} />
                        ) : (
                          <ChevronDownIcon onClick={() => handleSortChange('status', Direction.ASC)} />
                        )
                      }
                      size="xs"
                      ml={5}
                      variant="ghost"
                    />
                  </Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {displayedWorks.map((work) => (
                  <Tr key={work.identifier}>
                    <Td>
                      <>
                        {isInSciX(work) ? (
                          <SimpleLink href={`/abs/${encodeURIComponent(work.identifier)}`} newTab>
                            {work.title}
                          </SimpleLink>
                        ) : (
                          `${work.title}`
                        )}
                      </>
                    </Td>
                    <Td>{work.source.join(',')}</Td>
                    <Td>{new Date(work.updated).toLocaleDateString('en-US')}</Td>
                    <Td>{work.status ?? 'unclaimed'}</Td>
                    <Td>
                      <Actions
                        profile={work}
                        onAddClaim={handleAddClaim}
                        onDeleteClaim={handleDeleteClaim}
                        onSyncToOrcid={handleSyncToOrcid}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </>
        )
      ) : null}
    </Stack>
  );
};
