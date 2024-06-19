import { NextPage } from 'next';
import { Center, Heading } from '@chakra-ui/react';

const NotImplemented: NextPage = () => {
  return (
    <Center my="40">
      <Heading as="h1" size="xl">
        This page is not yet implemented
      </Heading>
    </Center>
  );
};

export default NotImplemented;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
