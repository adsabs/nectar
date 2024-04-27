import { fetchNotifications, vaultKeys } from '@/api';
import { Flex, Heading } from '@chakra-ui/react';
import { NotificationsPane } from '@/components';
import { composeNextGSSP } from '@/ssr-utils';
import { QueryClient } from '@tanstack/react-query';
import { GetServerSideProps, NextPage } from 'next';
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

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async () => {
  const queryClient = new QueryClient();

  void (await queryClient.prefetchQuery({
    queryKey: vaultKeys.notifications(),
    queryFn: fetchNotifications,
  }));

  return Promise.resolve({
    props: {},
  });
});
