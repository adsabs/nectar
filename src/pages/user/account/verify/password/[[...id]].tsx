import { getResetPasswordVerifyEmail } from '@auth-utils';
import { Alert, AlertDescription, AlertTitle, Container } from '@chakra-ui/react';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import { useRouter } from 'next/router';
import { isEmptyString } from 'ramda-adjunct';
import { useEffect } from 'react';
import { composeNextGSSP } from '@ssrUtils';

const TIMEOUT = 3000;
const VerifyPassword: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ email }) => {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => void router.push('/'), TIMEOUT);
  }, []);

  return (
    <Container centerContent size="lg" my="8">
      <Alert status="success">
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>The password for account {email} has been verified. Redirecting now...</AlertDescription>
      </Alert>
    </Container>
  );
};

export default VerifyPassword;

const goHome = { redirect: { destination: '/', permanent: false }, props: {} };
export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const { id } = ctx.params;

  if (isEmptyString(id?.[0])) {
    return goHome;
  }

  try {
    const email = await getResetPasswordVerifyEmail(id[0]);
    return {
      props: {
        email,
      },
    };
  } catch (e) {
    return goHome;
  }
});
