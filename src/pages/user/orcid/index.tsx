import { NextPage } from 'next';
import { Heading } from '@chakra-ui/layout';
import { useOrcidGetProfile } from '@api/orcid/orcid';
import { useOrcid } from '@hooks/orcid/useOrcid';
import { Code, List, ListItem } from '@chakra-ui/react';
import { isValidIOrcidUser } from '@api/orcid/models';

const OrcidPage: NextPage = () => {
  const { user } = useOrcid();
  const { data } = useOrcidGetProfile(
    { user },
    {
      enabled: isValidIOrcidUser(user),
    },
  );
  return (
    <>
      <Heading as="h2">ORCiD</Heading>
      <Heading size="md" as="h3">
        Works
      </Heading>
      {data ? (
        <List>
          {Object.values(data).map((work) => (
            <ListItem>
              <Code>{JSON.stringify(work, null, 2)}</Code>
            </ListItem>
          ))}
        </List>
      ) : null}
    </>
  );
};

export default OrcidPage;
