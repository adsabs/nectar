import { getSearchParams, useSearch } from '@api';
import { IOrcidProfile } from '@api/orcid/types';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { Stack, Heading, Table, Thead, Tr, Th, Tbody, Td, Text, Box } from '@chakra-ui/react';
import { Select, SelectOption } from '@components/Select';
import { SimpleLink } from '@components/SimpleLink';
import { useOrcid } from '@lib/orcid/useOrcid';
import { useMemo, useState } from 'react';

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
        return allWorsList.sort(compareFn(sortBy, 'asc')) as IOrcidProfileEntry[];
      case 'orcid':
        return allWorsList.filter((w) => w.status !== null).sort(compareFn(sortBy, 'asc')) as IOrcidProfileEntry[];
      case 'not-orcid':
        return allWorsList.filter((w) => w.status === null).sort(compareFn(sortBy, 'asc')) as IOrcidProfileEntry[];
      case 'not-scix':
        return allWorsList
          .filter((w) => w.source.indexOf('NASA Astrophysics Data System') === -1)
          .sort(compareFn(sortBy, 'asc')) as IOrcidProfileEntry[];
    }
  }, [allWorks, selectedFilter, sortBy]);

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
      {user && profile ? (
        displayedWorks.length === 0 ? (
          <Text>No papers found</Text>
        ) : (
          <>
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
                    <Td></Td>
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
