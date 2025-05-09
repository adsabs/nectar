import { Box, Center, Flex, HStack, Icon, Show, VisuallyHidden } from '@chakra-ui/react';
import { useStore } from '@/store';
import { AppMode } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { CSSProperties, ReactElement } from 'react';
import { ScixAndNasaLogo_H_beta } from '@/components/images/ScixAndNasaLogo-H_beta';

import { SimpleLink } from '@/components/SimpleLink/SimpleLink';
import { useColorModeColors } from '@/lib/useColorModeColors';

const imageStyle: CSSProperties = { objectFit: 'cover', opacity: '50%', zIndex: 0 };
export const LandingTabs = (): ReactElement => {
  const mode = useStore((state) => state.mode);

  return (
    <Flex direction="column" justifyContent="center" alignItems="center" position="relative" backgroundColor="black">
      {mode === AppMode.ASTROPHYSICS && (
        <Image src="/images/bg-astro.webp" alt="Starry sky" fill style={imageStyle} priority />
      )}
      {mode === AppMode.GENERAL && (
        <Image
          src="/images/bg-general.webp"
          alt="Hand touching colorful plasma globe"
          fill
          style={imageStyle}
          priority
        />
      )}
      {mode === AppMode.BIO_PHYSICAL && (
        <Image src="/images/bg-bio.webp" alt="Microscopic lifeform" fill style={imageStyle} priority />
      )}
      {mode === AppMode.EARTH_SCIENCE && (
        <Image src="/images/bg-earth.webp" alt="Zoomed out Earth" fill style={imageStyle} priority />
      )}
      {mode === AppMode.HELIOPHYSICS && (
        <Image src="/images/bg-helio.webp" alt="Up-close sun" fill style={imageStyle} priority />
      )}
      {mode === AppMode.PLANET_SCIENCE && (
        <Image src="/images/bg-planet.webp" alt="Jupiter in relief" fill style={imageStyle} priority />
      )}
      <Box padding={6} zIndex={5}>
        <TitleLogo />
      </Box>
      <Tabs show={mode === AppMode.ASTROPHYSICS} />
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

  const getActiveTab = () => {
    switch (pathname) {
      case '/classic-form':
        return 'classic-form';
      case '/paper-form':
        return 'paper-form';
      default:
        return 'modern-form';
    }
  };
  const tab = getActiveTab();
  return (
    <HStack justifyContent="center" spacing={2} zIndex={5} fontSize={{ base: 'md', sm: 'xl' }}>
      <Tab href="/classic-form" label="Classic Form" active={tab === 'classic-form'} />
      <Tab href="/" label="Modern Form" active={tab === 'modern-form'} />
      <Tab href="/paper-form" label="Paper Form" active={tab === 'paper-form'} />
      <input type="hidden" data-testid="active-tab" name="active-tab" value={tab} />
    </HStack>
  );
};

const TitleLogo = () => {
  return (
    <Center>
      <Show above="sm">
        <Icon as={ScixAndNasaLogo_H_beta} height="4em" width="25em" aria-hidden />
      </Show>
      <VisuallyHidden>Science Explorer</VisuallyHidden>
    </Center>
  );
};

interface ITabProps {
  href: string;
  label: string;
  active: boolean;
}
const Tab = ({ href, label, active }: ITabProps) => {
  const { background, highlightForeground } = useColorModeColors();
  return (
    <SimpleLink
      href={href}
      backgroundColor={active ? background : 'transparent'}
      color={active ? highlightForeground : 'gray.50'}
      px={4}
      py={2}
      borderTopRadius={3}
      fontWeight="semibold"
    >
      {label}
    </SimpleLink>
  );
};
