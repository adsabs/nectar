import { Container, Flex } from '@chakra-ui/layout';
import { LandingTabs } from '@components';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';

export const Layout: FC = ({ children }) => {
  const router = useRouter();
  const isLandingPages = /^(\/|\/(classic|paper)-form.*)$/.exec(router.asPath);
  return (
    <Flex direction="column">
      <Head>
        <title>NASA Science Explorer</title>
      </Head>
      <NavBar />
      <main>
        {isLandingPages && <LandingTabs />}
        <Container maxW={isLandingPages ? 'container.md' : 'container.xl'} id="main-content">
          {children}
        </Container>
      </main>
      <Footer />
    </Flex>
  );
};
