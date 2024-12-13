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

const Planetary: NextPage = () => {
  const router = useRouter();
  const [mode, setMode]: [AppMode, (mode: AppMode) => void] = useStore((state) => [state.mode, state.setMode], shallow);

  const handleLink = (path: string) => {
    if (mode !== AppMode.PLANET_SCIENCE) {
      setMode(AppMode.PLANET_SCIENCE);
    }
    router.push(path);
  };

  return (
    <>
      <Head>
        <title>Science Explorer - Planetary Science</title>
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
            src="/images/bg-planet.webp"
            alt="planet"
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
        <Center>
          <Text as="h3" fontSize="4xl" my={6}>
            Search Examples
          </Text>
        </Center>
        <Container maxW="container.md" my={4} minH="container.sm" mb={10}>
          <Box fontSize="xl">
            <Center>
              <Text as="h2" fontSize="6xl" my={6}>
                Planetary Science
              </Text>
            </Center>
            <HStack gap={10}>
              <Image src="/styles/img/disc-planetary.jpg" w="300px" />
              <Text>
                Advance scientific knowledge of the origin and history of the solar system, the potential for life
                elsewhere, and the hazards and resources present as humans explore space
              </Text>
            </HStack>
            <Flex direction="row" justifyContent="center">
              <Tooltip
                label={`Search for all the first author papers from the project scientist of the recently launched Europa Clipper mission`}
              >
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink(
                      '/search?q=author%3A%22%5ERobert+Pappalardo%22++&sort=score+desc&sort=date+desc&p=1&n=10',
                    )
                  }
                >
                  <FontAwesomeIcon icon={faUser} size="4x" />
                  <Text>Authors</Text>
                </VStack>
              </Tooltip>
              <Tooltip
                label={`Search for papers related to the Cassini mission to Saturn that link to data in the Planetary Data System (PDS)`}
              >
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink('/search?q=abs%3A%22Cassini%22+data%3APDS&sort=score+desc&sort=date+desc&p=1&n=10')
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
                      '/search?q=title%3A%22A+new+era+in+solar+system+astronomy+with+JWST%22&sort=score+desc&sort=date+desc&p=1&n=10',
                    )
                  }
                >
                  <FontAwesomeIcon icon={faNewspaper} size="4x" />
                  <Text>Publications</Text>
                </VStack>
              </Tooltip>
              <Tooltip
                label={`Find all the papers produced by scholars at Hampton University that mention the word “planet” in the abstract`}
              >
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink(
                      '/search?q=aff%3A%22Hampton+University%22+abs%3A%22planet%22&sort=score+desc&sort=date+desc&p=1&n=10',
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

export default Planetary;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
