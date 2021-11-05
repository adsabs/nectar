import { GetServerSideProps, NextPage } from 'next';

const Login: NextPage = () => {
  return <></>;
};

export const getServerSideProps: GetServerSideProps = async () => {
  return Promise.resolve({
    redirect: {
      destination: '/not-implemented',
      permanent: false,
    },
  });
};

export default Login;
