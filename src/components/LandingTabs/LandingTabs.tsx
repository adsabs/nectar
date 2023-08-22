import { Box, Center, Flex, Heading, HStack, Icon, Link, Show, Text } from '@chakra-ui/react';
import { AdsSmallLogo } from '@components/images';
import { useStore } from '@store';
import { Theme } from '@types';
import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { CSSProperties, ReactElement } from 'react';

const imageStyle: CSSProperties = { objectFit: 'cover', opacity: '50%', zIndex: 0 };
export const LandingTabs = (): ReactElement => {
  const theme = useStore((state) => state.theme);

  return (
    <Flex direction="column" justifyContent="center" alignItems="center" position="relative" backgroundColor="black">
      {theme === Theme.ASTROPHYSICS && (
        <Image src="/images/bg-astro.webp" alt="Starry sky" fill style={imageStyle} priority />
      )}
      {theme === Theme.GENERAL && (
        <Image
          src="/images/bg-general.webp"
          alt="Hand touching colorful plasma globe"
          fill
          style={imageStyle}
          priority
        />
      )}
      {theme === Theme.BIO_PHYSICAL && (
        <Image src="/images/bg-bio.webp" alt="Microscopic lifeform" fill style={imageStyle} priority />
      )}
      {theme === Theme.EARTH_SCIENCE && (
        <Image src="/images/bg-earth.webp" alt="Zoomed out Earth" fill style={imageStyle} priority />
      )}
      {theme === Theme.HELIOPHYSICS && (
        <Image src="/images/bg-helio.webp" alt="Up-close sun" fill style={imageStyle} priority />
      )}
      {theme === Theme.PLANET_SCIENCE && (
        <Image src="/images/bg-planet.webp" alt="Jupiter in relief" fill style={imageStyle} priority />
      )}
      <Box padding={6} zIndex={5}>
        <TitleLogo />
      </Box>
      <Tabs show={theme === Theme.ASTROPHYSICS} />
    </Flex>
  );
};

export const LandingTabsStatic = () => {
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" position="relative" backgroundColor="black">
      <Box padding={6} zIndex={5}>
        <TitleLogo />
      </Box>
    </Flex>
  );
};

const Tabs = ({ show }: { show: boolean }) => {
  const { pathname } = useRouter();
  if (!show) {
    return null;
  }
  return (
    <HStack justifyContent="center" spacing={2} zIndex={5} color="white" fontSize={{ base: 'md', sm: 'xl' }}>
      <Tab href="/classic-form" label="Classic Form" active={pathname === '/classic-form'} />
      <Tab href="/" label="Modern Form" active={pathname === '/'} />
      <Tab href="/paper-form" label="Paper Form" active={pathname === '/paper-form'} />
    </HStack>
  );
};

const TitleLogo = () => {
  return (
    <Center>
      <Show above="sm">
        <Icon as={AdsSmallLogo} fontSize="60" aria-hidden />
      </Show>
      <Heading as="h2" color="white" fontSize={['23', '36']} ml={2}>
        <Text as="span" fontWeight="bold">
          NASA
        </Text>{' '}
        <Text as="span" fontWeight="normal">
          Science Explorer
        </Text>
      </Heading>
    </Center>
  );
};

interface ITabProps {
  href: string;
  label: string;
  active: boolean;
}
const Tab = ({ href, label, active }: ITabProps) => {
  return (
    <Link as={NextLink} href={href} passHref>
      <Box
        as={'a'}
        backgroundColor={active ? 'white' : 'transparent'}
        color={active ? 'blue.400' : 'gray.50'}
        px={4}
        py={2}
        borderTopRadius={3}
        fontWeight="semibold"
      >
        {label}
      </Box>
    </Link>
  );
};
