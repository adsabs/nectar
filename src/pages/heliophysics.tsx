import { ScixAndNasaLogo_H_beta } from '@/components/images/ScixAndNasaLogo-H_beta';
import { useStore } from '@/store';
import { AppMode } from '@/types';
import {
  Box,
  Center,
  Container,
  Flex,
  HStack,
  Icon,
  Image,
  Show,
  Text,
  Tooltip,
  VisuallyHidden,
  VStack,
} from '@chakra-ui/react';
import { faBuildingColumns, faChartSimple, faNewspaper, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NextPage } from 'next';
import Head from 'next/head';
import NextImage from 'next/image';
import { useRouter } from 'next/router';
import shallow from 'zustand/shallow';

const Heliophysics: NextPage = () => {
  const router = useRouter();
  const [mode, setMode]: [AppMode, (mode: AppMode) => void] = useStore((state) => [state.mode, state.setMode], shallow);

  const handleLink = (path: string) => {
    if (mode !== AppMode.HELIOPHYSICS) {
      setMode(AppMode.HELIOPHYSICS);
    }
    router.push(path);
  };

  return (
    <>
      <Head>
        <title>Science Explorer - Heliophysics</title>
      </Head>
      <Box background="blackAlpha.900" color="gray.200">
        <Flex
          direction="column"
          justifyContent="center"
          alignItems="center"
          position="relative"
          backgroundColor="black"
        >
          <NextImage
            src="/images/bg-helio.webp"
            alt="sun"
            fill
            style={{ objectFit: 'cover', opacity: '50%', zIndex: 0 }}
            priority
            aria-hidden
          />
          <Box padding={6} zIndex={5}>
            <Center>
              <Show above="sm">
                <Icon as={ScixAndNasaLogo_H_beta} height="4em" width="25em" aria-hidden />
              </Show>
              <VisuallyHidden>Science Explorer</VisuallyHidden>
            </Center>
          </Box>
        </Flex>
        <Container maxW="container.md" my={4} minH="container.sm" mb={10}>
          <Box fontSize="xl">
            <Center>
              <Text as="h2" fontSize="6xl" my={6}>
                Heliophysics
              </Text>
            </Center>
            <HStack gap={10}>
              <Image src="/styles/img/disc-heliophysics.jpg" w="300px" />
              <Text>Understand the Sun and its effects on Earth and the solar system.</Text>
            </HStack>
            <Center>
              <Text as="h3" fontSize="4xl" my={6}>
                Search Examples
              </Text>
            </Center>
            <Flex direction="row" justifyContent="center">
              <Tooltip label={``}>
                <VStack m={10} cursor="pointer" onClick={() => handleLink('/')}>
                  <FontAwesomeIcon icon={faUser} size="4x" />
                  <Text>Authors</Text>
                </VStack>
              </Tooltip>
              <Tooltip label={``}>
                <VStack m={10} cursor="pointer" onClick={() => handleLink('/')}>
                  <FontAwesomeIcon icon={faChartSimple} size="4x" />
                  <Text>Data</Text>
                </VStack>
              </Tooltip>
              <Tooltip label={``}>
                <VStack m={10} cursor="pointer" onClick={() => handleLink('/')}>
                  <FontAwesomeIcon icon={faNewspaper} size="4x" />
                  <Text>Publications</Text>
                </VStack>
              </Tooltip>
              <Tooltip label={``}>
                <VStack m={10} cursor="pointer" onClick={() => handleLink('/')}>
                  <FontAwesomeIcon icon={faBuildingColumns} size="4x" />
                  <Text>Institutions</Text>
                </VStack>
              </Tooltip>
            </Flex>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default Heliophysics;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
