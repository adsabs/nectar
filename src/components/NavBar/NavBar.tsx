import { Heading, HStack, Box, Link as CLink } from '@chakra-ui/layout';
import { AdsSmallLogo } from '@components/images';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FC } from 'react';

const ThemeDropdown = dynamic(() => import('./ThemeDropdown').then((mod) => mod.ThemeDropdown), { ssr: false });

const NavMenus = dynamic(() => import('./NavMenus').then((mod) => mod.NavMenus), { ssr: false });

export const NavBar: FC = () => {
  return (
    <nav>
      <HStack direction="row" alignItems="center" spacing={3} margin={2}>
        <Box display={{ base: 'none', sm: 'initial' }}>
          <Link href="/">
            <HStack cursor="pointer" spacing={1}>
              <AdsSmallLogo className="w-10 h-10" aria-hidden />
              <Heading
                as="h1"
                size="lg"
                tabIndex={0}
                color="gray.50"
                _focus={{ boxShadow: 'outline', outline: 'none' }}
              >
                SciX
              </Heading>
            </HStack>
          </Link>
        </Box>
        <ThemeDropdown />
        <CLink href="#main-content" color="gray.50" className="focus:not-sr-only sr-only">
          Skip to content
        </CLink>
        <NavMenus />
      </HStack>
    </nav>
  );
};
