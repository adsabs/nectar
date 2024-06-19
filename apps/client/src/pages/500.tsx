import type { NextPage } from 'next';
import Error from 'next/error';

const Error500Page: NextPage = () => {
  return <Error statusCode={500} />;
};

export default Error500Page;
