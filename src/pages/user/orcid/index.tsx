import { NextPage } from 'next';
import { Heading } from '@chakra-ui/layout';
import { useOrcid } from '@hooks/orcid/useOrcid';
import { Code, List, ListItem } from '@chakra-ui/react';

const OrcidPage: NextPage = () => {
  const { profile } = useOrcid();
  return (
    <>
      <Heading as="h2">ORCiD</Heading>
      <Heading size="md" as="h3">
        Works
      </Heading>
      {profile ? (
        <List>
          {Object.values(profile).map((work) => (
            <ListItem key={work.identifier}>
              <Code>{JSON.stringify(work, null, 2)}</Code>
            </ListItem>
          ))}
        </List>
      ) : null}
    </>
  );
};

export default OrcidPage;
