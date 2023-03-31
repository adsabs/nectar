import { NextPage } from 'next';
import Head from 'next/head';

export { injectSessionGSSP as getServerSideProps } from '@ssrUtils';

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

// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   if (!ctx.req.session.isAuthenticated) {
//     return Promise.resolve({
//       redirect: {
//         destination: `/user/account/login?redirectUri=${encodeURIComponent(ctx.req.url)}`,
//         permanent: false,
//       },
//       props: {},
//     });
//   }
//
//   return Promise.resolve({
//     props: {},
//   });
// });
