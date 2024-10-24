import { Container, Flex, useMediaQuery } from '@chakra-ui/react';
import { SkipNavLink } from '@chakra-ui/skip-nav';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';
import dynamic from 'next/dynamic';

import { Notification } from '@/components/Notification';
import Head from 'next/head';
import { Favicons } from '@/components/Favicons/Favicons';
import { BRAND_NAME_FULL } from '@/config';
import { LandingTabsStatic } from '@/components/LandingTabs';

const LandingTabs = dynamic(
  () =>
    import('@/components/LandingTabs/LandingTabs').then((mod) => ({
      default: mod.LandingTabs,
    })),
  {
    ssr: false,
    loading: () => <LandingTabsStatic />,
  },
);

const LANDING_PAGES = ['/', '/classic-form', '/paper-form'];
export const Layout: FC = ({ children }) => {
  const router = useRouter();

  const isLandingPage = LANDING_PAGES.includes(router.pathname);

  const [isPrint] = useMediaQuery('print');

  return (
    <Flex direction="column">
      <Head>
        <title>{`${BRAND_NAME_FULL}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="charset" content="utf-8" />
        <Favicons />
      </Head>
      <SkipNavLink id="main-content">Skip to content</SkipNavLink>
      {isPrint ? null : <NavBar />}
      {isPrint ? null : <Notification />}
      <main>
        {isLandingPage && <LandingTabs />}
        <Container maxW={isLandingPage ? 'container.md' : 'container.xl'} id="main-content">
          {children}
        </Container>
      </main>
      {isPrint ? null : <Footer />}
    </Flex>
  );
};
