import { Box, Flex, Heading, HStack, Link, Stack, Text } from '@chakra-ui/layout';
import { AdsSmallLogo } from '@components/images';
import { useViewport, Viewport } from '@hooks';
import { useAppCtx } from '@store';
import { Theme } from '@types';
import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import starBg from 'public/img/bg-astro.jpg';
import bioBg from 'public/img/bg-bio.jpg';
import earthBg from 'public/img/bg-earth.jpg';
import generalBg from 'public/img/bg-general.jpg';
import helioBg from 'public/img/bg-helio.jpg';
import planetBg from 'public/img/bg-planet.jpg';
import { ReactElement, useEffect, useState } from 'react';

const backgroundMap = new Map<Theme, StaticImageData>([
  [Theme.GENERAL, generalBg],
  [Theme.ASTROPHYSICS, starBg],
  [Theme.HELIOPHYISCS, helioBg],
  [Theme.PLANET_SCIENCE, planetBg],
  [Theme.EARTH_SCIENCE, earthBg],
  [Theme.BIO_PHYSICAL, bioBg],
]);

export const LandingTabs = (): ReactElement => {
  const {
    state: { theme },
  } = useAppCtx();
  const [showTabs, setShowTabs] = useState(false);
  const [img, setImg] = useState<StaticImageData>(null);

  useEffect(() => {
    setShowTabs(theme === Theme.ASTROPHYSICS);
    setImg(backgroundMap.get(theme));
  }, [theme]);

  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      position="relative"
      backgroundColor="black"
      suppressHydrationWarning
    >
      {img !== null && (
        <Image
          className="z-0 opacity-50 object-cover"
          src={img}
          aria-hidden="true"
          layout="fill"
          quality={30}
          priority
          alt=""
        />
      )}

      <Box padding={6} zIndex={5}>
        <TitleLogo />
      </Box>
      <Tabs show={showTabs} />
    </Flex>
  );
};

const Tabs = ({ show }: { show: boolean }) => {
  const { asPath } = useRouter();
  if (!show) {
    return null;
  }
  return (
    <HStack justifyContent="center" spacing={2} zIndex={5} color="white" fontSize={{ base: 'md', sm: 'xl' }}>
      <Tab href="/classic-form" label="Classic Form" active={asPath === '/classic-form'} />
      <Tab href="/" label="Modern Form" active={asPath === '/'} />
      <Tab href="/paper-form" label="Paper Form" active={asPath === '/paper-form'} />
    </HStack>
  );
};

const TitleLogo = () => {
  const viewport = useViewport();
  return (
    <Stack direction="row" justifyContent="center" alignItems="center" spacing={3} hidden={viewport < Viewport.SM}>
      <AdsSmallLogo className="w-16 h-16" aria-hidden />
      <Heading as="h2" color="white">
        <Text as="span" fontWeight="bold">
          NASA
        </Text>{' '}
        <Text as="span" fontWeight="normal">
          Science Explorer
        </Text>
      </Heading>
    </Stack>
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
        fontSize="md"
        fontWeight="semibold"
      >
        {label}
      </Box>
    </Link>
  );
};
