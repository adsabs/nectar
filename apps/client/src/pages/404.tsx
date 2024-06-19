import type { NextPage } from 'next';
import Error from 'next/error';

const Error404Page: NextPage = () => {
  return <Error statusCode={404} />;
};

export default Error404Page;
