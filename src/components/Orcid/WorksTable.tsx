import { Stack, Heading, Table, Thead, Tr, Th, Tbody, Td, Text } from '@chakra-ui/react';
import { SimpleLink } from '@components/SimpleLink';
import { useOrcid } from '@lib/orcid/useOrcid';

// TODO: pagination

export const WorksTable = () => {
  const { user, profile } = useOrcid();
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
        Object.values(profile).length === 0 ? (
          <Text>No papers found</Text>
        ) : (
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
              {Object.values(profile)?.map((work) => (
                <Tr key={work.identifier}>
                  <Td>{work.title}</Td>
                  <Td>{work.source.join(',')}</Td>
                  <Td>{new Date(work.updated).toLocaleDateString('en-US')}</Td>
                  <Td>{work.status}</Td>
                  <Td></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )
      ) : null}
    </Stack>
  );
};
