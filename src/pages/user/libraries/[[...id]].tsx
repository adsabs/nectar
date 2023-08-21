import { NextPage } from 'next';
import Head from 'next/head';

const LibrariesHome: NextPage = () => {
  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Libraries</title>
      </Head>
      <div>
        <h2>Libraries</h2>
      </div>
    </div>
  );
};

export default LibrariesHome;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
