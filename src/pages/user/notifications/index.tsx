import { Flex, Heading } from '@chakra-ui/react';
import { NotificationsPane } from '@components';
import { NextPage } from 'next';
import Head from 'next/head';

const NotificationPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>NASA Science Explorer - Email Notifications</title>
      </Head>
      <Flex my={4} direction="column" gap={4}>
        <Heading as="h2" id="title" variant="pageTitle">
          Email Notifications
        </Heading>
      </Flex>
      <NotificationsPane />
    </>
  );
};

export default NotificationPage;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
