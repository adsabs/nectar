import { verifyAccount } from '@auth-utils';
import { Alert, AlertDescription, AlertTitle, Container } from '@chakra-ui/react';
import { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next';
import { useRouter } from 'next/router';
import { isEmptyString, isPlainObject } from 'ramda-adjunct';
import { useEffect } from 'react';
import { composeNextGSSP } from '@ssrUtils';

const TIMEOUT = 3000;
const VerifyEmail: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = () => {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => void router.push('/'), TIMEOUT);
  }, []);

  return (
    <Container centerContent size="lg" my="8">
      <Alert status="success">
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>Your email has been updated. Redirecting now...</AlertDescription>
      </Alert>
    </Container>
  );
};

export default VerifyEmail;

const goHome = { redirect: { destination: '/', permanent: false }, props: {} };
export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const { id } = ctx.params;

  if (isEmptyString(id?.[0])) {
    return goHome;
  }

  try {
    const result = await verifyAccount(id[0], ctx.res);

    // TODO: Redirect to an error page if verify fails? right now we're going home
    if (isPlainObject(result)) {
      // we are authenticated, so we need to set that on the session
      ctx.req.session.isAuthenticated = true;
      ctx.req.session.token = result;
      await ctx.req.session.save();
      return { props: {} };
    } else if (typeof result === 'boolean' && result) {
      return { props: {} };
    }
    return goHome;
  } catch (e) {
    return goHome;
  }
});
