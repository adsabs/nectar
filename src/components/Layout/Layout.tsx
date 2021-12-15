import { LandingTabs } from '@components/LandingTabs';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';
import Head from 'next/head';
import { Container, Flex } from '@chakra-ui/layout';

export const Layout: FC = ({ children }) => {
  const router = useRouter();
  const isLandingPages = /^(\/|\/classic-form(#main-content)?|\/paper-form(#main-content)?)$/.exec(router.asPath);
  return (
    <Flex direction="column">
      <Head>
        <title>NASA Science Explorer</title>
      </Head>
      <NavBar />
      <main>
        {isLandingPages && <LandingTabs />}
        <Container maxW={isLandingPages ? 'container.md' : 'container.lg'} id="main-content">
          {children}
        </Container>
      </main>
      <Footer />
    </Flex>
  );
};
