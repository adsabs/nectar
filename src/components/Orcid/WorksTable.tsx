import { getSearchParams, useSearch } from '@api';
import { IOrcidProfile } from '@api/orcid/types';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { Stack, Heading, Table, Thead, Tr, Th, Tbody, Td, Text, Box, useToast } from '@chakra-ui/react';
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

// get sort function
const compareFn = (sortByField: 'title' | 'updated' | 'status', direction: 'asc' | 'desc') => {
  return (w1: IOrcidProfileEntry, w2: IOrcidProfileEntry) => {
    if (direction === 'asc') {
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

  // TODO: sorting
  const [sortBy, setSortBy] = useState<'title' | 'updated' | 'status'>('title');

  // displayed works after filter and sorting applied
  const displayedWorks = useMemo(() => {
    const allWorsList = allWorks ? Object.values(allWorks) : [];
    switch (selectedFilter.id) {
      case 'all':
        return allWorsList.sort(compareFn(sortBy, 'asc'));
      case 'orcid':
        return allWorsList.filter((w) => w.status !== null).sort(compareFn(sortBy, 'asc'));
      case 'not-orcid':
        return allWorsList.filter((w) => w.status === null).sort(compareFn(sortBy, 'asc'));
      case 'not-scix':
        return allWorsList
          .filter((w) => w.source.indexOf('NASA Astrophysics Data System') === -1)
          .sort(compareFn(sortBy, 'asc'));
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
            <Table>
              <Thead>
                <Tr>
                  <Th w="30%">Title</Th>
                  <Th>Claimed By</Th>
                  <Th w="10%">Date Updated</Th>
                  <Th>Status</Th>
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
