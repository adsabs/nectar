import { GetServerSideProps, NextPage } from 'next';

const Login: NextPage = () => {
  return <></>;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/not-implemented',
      permanent: false,
    },
  };
};

export default Login;
