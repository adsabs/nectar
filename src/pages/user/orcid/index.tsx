import { NextPage } from 'next';
import { Heading } from '@chakra-ui/layout';
import { useOrcid } from '@lib/orcid/useOrcid';
import { Box, Button, Code, List, ListItem } from '@chakra-ui/react';
import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { useUpdateWork } from '@lib/orcid/useUpdateWork';

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
              <Box>
                <Code>{JSON.stringify(work, null, 2)}</Code>
                <UpdateBtn work={work} />
              </Box>
            </ListItem>
          ))}
        </List>
      ) : null}
    </>
  );
};

const UpdateBtn = ({ work }: { work: IOrcidProfileEntry }) => {
  const { updateWork, isLoading } = useUpdateWork();

  return (
    <Button onClick={() => updateWork({ putcode: work.putcode })} isLoading={isLoading}>
      update work
    </Button>
  );
};

export default OrcidPage;
