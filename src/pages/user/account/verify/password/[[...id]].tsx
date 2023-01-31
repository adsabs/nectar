import { getResetPasswordVerifyEmail } from '@auth-utils';
import { Alert, AlertDescription, AlertTitle, Container } from '@chakra-ui/react';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import { useRouter } from 'next/router';
import { isNonEmptyString } from 'ramda-adjunct';
import { useEffect } from 'react';

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

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const { id } = ctx.params;

  if (isNonEmptyString(id?.[0])) {
    // redirect or something
  }

  try {
    const email = await getResetPasswordVerifyEmail(id[0]);
    return {
      props: {
        email,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
      props: {},
    };
  }
}, userGSSP);
