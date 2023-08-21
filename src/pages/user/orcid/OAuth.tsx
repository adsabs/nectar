import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Alert, Box, Container, Spinner } from '@chakra-ui/react';
import { isString } from '@utils';
import { useOrcidExchangeToken } from '@api/orcid/orcid';
import { isArray } from 'ramda-adjunct';
import { useEffect } from 'react';
import { AppState, useStore } from '@store';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';
const setOrcidUserSelector = (state: AppState) => state.setOrcidUser;

const OrcidPage: NextPage = () => {
  const router = useRouter();
  const setOrcidUser = useStore(setOrcidUserSelector);
  const code = isArray(router.query.code) ? router.query.code[0] : router.query.code;

  const { data } = useOrcidExchangeToken(
    { code },
    {
      enabled: isString(code),
    },
  );

  useEffect(() => {
    if (data) {
      setOrcidUser(data);
      void router.replace('/user/orcid');
    }
  }, [data]);

  return (
    <Container centerContent my="8">
      <Alert status="info" display="flex" justifyContent="center">
        <Spinner />
        <Box ml="2">Authenticating with ORCiD</Box>
      </Alert>
    </Container>
  );
};

export default OrcidPage;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
