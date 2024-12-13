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

const Astrophysics: NextPage = () => {
  const router = useRouter();
  const [mode, setMode]: [AppMode, (mode: AppMode) => void] = useStore((state) => [state.mode, state.setMode], shallow);

  const handleLink = (path: string) => {
    if (mode !== AppMode.ASTROPHYSICS) {
      setMode(AppMode.ASTROPHYSICS);
    }
    router.push(path);
  };

  return (
    <>
      <Head>
        <title>Science Explorer - Astrophysics</title>
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
            src="/images/bg-astro.webp"
            alt="Starry sky"
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
                Astrophysics
              </Text>
            </Center>
            <HStack gap={10}>
              <Image src="/styles/img/disc-astrophysics.png" w="300px" />
              <Text>
                Discover the origin, structure, evolution, and destiny of the universe, and search for Earth-like
                planets.
              </Text>
            </HStack>
            <Center>
              <Text as="h3" fontSize="4xl" my={6}>
                Search Examples
              </Text>
            </Center>
            <Flex direction="row" justifyContent="center">
              <Tooltip
                label={`Search for all the first author papers from 2020 Nobel Laureate in physics; recognized for his work on black holes`}
              >
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink(
                      `/search?q=author%3A%E2%80%9D%5EPenrose%2C+Roger%E2%80%9D&sort=score+desc&sort=date+desc&p=1`,
                    )
                  }
                >
                  <FontAwesomeIcon icon={faUser} size="4x" />
                  <Text>Authors</Text>
                </VStack>
              </Tooltip>
              <Tooltip
                label={`Search for papers related to the Milky Way Galaxy that link to data at the Strasbourg astronomical Data Center (CDS, usually in the VizieR system)`}
              >
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink('/search?q=abs%3A%22Milky+Way%22+data%3ACDS&sort=score+desc&sort=date+desc&p=1')
                  }
                >
                  <FontAwesomeIcon icon={faChartSimple} size="4x" />
                  <Text>Data</Text>
                </VStack>
              </Tooltip>
              <Tooltip label={`Search for a specific paper based on known information about the paper`}>
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink(
                      '/search?q=title%3A%22NY+Bootes%3A+An+Active+Deep+and+Low-mass-ratio+Contact+Binary+with+a+Cool+Companion+in+a+Hierarchical+Triple+System%22&sort=score+desc&sort=date+desc&p=1&n=10',
                    )
                  }
                >
                  <FontAwesomeIcon icon={faNewspaper} size="4x" />
                  <Text>Publications</Text>
                </VStack>
              </Tooltip>
              <Tooltip
                label={`Identify papers about gravitational waves written by researchers outside of MIT and Caltech`}
              >
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink(
                      '/search?q=abs%3A%22gravitational+wave%22+-aff%3A%22Massachusetts+Institute+of+Technology%22+-aff%3A%22California+Institute+of+Technology%22&sort=score+desc&sort=date+desc&p=1',
                    )
                  }
                >
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

export default Astrophysics;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
