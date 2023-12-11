import { Container, Flex, useMediaQuery } from '@chakra-ui/react';
import { SkipNavLink } from '@chakra-ui/skip-nav';
import { useRouter } from 'next/router';
import { ReactNode, useMemo } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';
import dynamic from 'next/dynamic';
import { LandingTabsStatic, SimpleLink } from '@components';
import { Notification } from '@components/Notification';
import Head from 'next/head';

const LandingTabs = dynamic(() => import('@components/LandingTabs/LandingTabs').then((mod) => mod.LandingTabs), {
  ssr: false,
  loading: () => <LandingTabsStatic />,
});

const LANDING_PAGES = ['/', '/classic-form', '/paper-form'];

const darkModeFavicon = '/favicon-dark.png';

const lightModeFavicon = '/favicon-light.png';

export const Layout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const isLandingPage = LANDING_PAGES.includes(router.pathname);

  const [isPrint] = useMediaQuery('print');

  const [isDarkMode] = useMediaQuery('(prefers-color-scheme: dark)');

  const favicon = useMemo(() => (isDarkMode ? darkModeFavicon : lightModeFavicon), [isDarkMode]);

  return (
    <Flex direction="column">
      <Head>
        <title>NASA Science Explorer</title>
        <SimpleLink rel="icon" type="image/png" href={favicon} />
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
