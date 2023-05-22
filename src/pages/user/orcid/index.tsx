import { NextPage } from 'next';
import { Stack } from '@chakra-ui/react';
import { UserSettings, WorksTable } from '@components/Orcid';

const OrcidPage: NextPage = () => {
  return (
    <Stack direction={{ base: 'column', lg: 'row' }} spacing={6} my={{ base: 2, lg: 10 }}>
      <UserSettings />
      <WorksTable />
    </Stack>
  );
};

export default OrcidPage;
