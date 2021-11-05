import { GetServerSideProps, NextPage } from 'next';

const Login: NextPage = () => {
  return <></>;
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/not-implemented',
      permanent: false,
    },
  };
};

export default Login;
