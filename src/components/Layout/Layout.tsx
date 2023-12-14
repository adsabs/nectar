import { Container, Flex, IconButton, Tooltip, useColorMode, useMediaQuery } from '@chakra-ui/react';
import { SkipNavLink } from '@chakra-ui/skip-nav';
import { useRouter } from 'next/router';
import { FC, useMemo } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';
import dynamic from 'next/dynamic';
import { LandingTabsStatic } from '@components';
import { Notification } from '@components/Notification';
import Head from 'next/head';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

const LandingTabs = dynamic(() => import('@components/LandingTabs/LandingTabs').then((mod) => mod.LandingTabs), {
  ssr: false,
  loading: () => <LandingTabsStatic />,
});

const LANDING_PAGES = ['/', '/classic-form', '/paper-form'];

const darkModeFavicon = '/favicon-dark.png';

const lightModeFavicon = '/favicon-light.png';

export const Layout: FC = ({ children }) => {
  const router = useRouter();

  const isLandingPage = LANDING_PAGES.includes(router.pathname);

  const [isPrint] = useMediaQuery('print');

  const [isDarkMode] = useMediaQuery('(prefers-color-scheme: dark)');

  const favicon = useMemo(() => (isDarkMode ? darkModeFavicon : lightModeFavicon), [isDarkMode]);

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Flex direction="column">
      <Head>
        <title>NASA Science Explorer</title>
        <link rel="icon" type="image/png" href={favicon} />
      </Head>
      <SkipNavLink id="main-content">Skip to content</SkipNavLink>
      {isPrint ? null : <NavBar />}
      {isPrint ? null : <Notification />}
      <main>
        <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton
            size="lg"
            position="fixed"
            bottom={10}
            right={10}
            onClick={toggleColorMode}
            color={colorMode === 'light' ? 'gray.50' : 'gray.800'}
            backgroundColor={colorMode === 'light' ? 'gray.800' : 'gray.50'}
            border="1px solid"
            aria-label="toggle dark mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            zIndex="sticky"
            isRound
          />
        </Tooltip>
        {isLandingPage && <LandingTabs />}
        <Container maxW={isLandingPage ? 'container.md' : 'container.xl'} id="main-content">
          {children}
        </Container>
      </main>
      {isPrint ? null : <Footer />}
    </Flex>
  );
};
