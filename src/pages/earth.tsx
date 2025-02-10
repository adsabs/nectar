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

const EarthScience: NextPage = () => {
  const router = useRouter();
  const [mode, setMode]: [AppMode, (mode: AppMode) => void] = useStore((state) => [state.mode, state.setMode], shallow);

  const handleLink = (path: string) => {
    if (mode !== AppMode.EARTH_SCIENCE) {
      setMode(AppMode.EARTH_SCIENCE);
    }
    router.push(path);
  };

  return (
    <>
      <Head>
        <title>Science Explorer - Earth science</title>
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
            src="/images/bg-earth.webp"
            alt="earth"
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
                Earth Science
              </Text>
            </Center>
            <HStack gap={10}>
              <Image src="/styles/img/disc-earth.png" w="300px" />
              <Text>Study planet Earth from space to advance scientific understanding and meet societal needs</Text>
            </HStack>
            <Flex direction="row" justifyContent="center">
              <Tooltip
                label={`Find the foundational papers authored by Alfred Wegener that initiated the notion of plate tectonics`}
              >
                <VStack
                  m={10}
                  cursor="pointer"
                  onClick={() =>
                    handleLink('/search?q=author%3A%22%5Ewegener%2C+alfred%22&sort=date+asc&sort=date+desc&n=10&p=1')
                  }
                >
                  <FontAwesomeIcon icon={faUser} size="4x" />
                  <Text>Authors</Text>
                </VStack>
              </Tooltip>
              <VStack
                m={10}
                cursor="pointer"
                onClick={() =>
                  handleLink('/search?q=collection%3Aearthscience+data%3Anoaa&sort=score+desc&sort=date+desc&p=1')
                }
              >
                <FontAwesomeIcon icon={faChartSimple} size="4x" />
                <Text>Data</Text>
              </VStack>
              <VStack
                m={10}
                cursor="pointer"
                onClick={() =>
                  handleLink('/search?q=title%3A%22continental+drift%22&sort=date+asc&sort=date+desc&n=10&p=1')
                }
              >
                <FontAwesomeIcon icon={faNewspaper} size="4x" />
                <Text>Publications</Text>
              </VStack>
              <VStack
                m={10}
                cursor="pointer"
                onClick={() =>
                  handleLink('search?q=collection%3Aearthscience+institution%3AMIT&sort=score+desc&sort=date+desc&p=1')
                }
              >
                <FontAwesomeIcon icon={faBuildingColumns} size="4x" />
                <Text>Institutions</Text>
              </VStack>
            </Flex>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default EarthScience;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
