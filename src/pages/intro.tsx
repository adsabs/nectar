import { ScixLogoAndAbbrAndLink_H, ScixText_H } from '@/components/images';
import { SimpleLink } from '@/components/SimpleLink';
import { Box, Center, Container, Flex, HStack, Image, Text } from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';

const IntroPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Science Explorer - scixplorer.org</title>
      </Head>
      <Box background="blackAlpha.900" color="gray.200">
        <Container maxW="container.md" my={10} minH="container.sm">
          <Flex direction="column" gap={10}>
            <ScixLogoAndAbbrAndLink_H />
            <Image src="/styles/img/disc.jpg" maxW="full" aria-hidden />
            <ScixText_H />
            <Box fontSize="xl">
              <Center>
                <Text as="h2" fontSize="6xl" my={6}>
                  Getting Started at SciX
                </Text>
              </Center>
              <Text>
                The SciX portal maintains six main bibliographic collections covering general science, astronomy and
                astrophysics, heliophysics, planetary science, earth science, and biological and physical sciences. It
                contains over 20 million records, including refereed publications, arXiv, ESS Open Archive, and
                EarthArXiv preprints. SciX also provides links to conference proceedings, datasets, and software.
              </Text>
            </Box>
            <Box fontSize="2xl" my={10}>
              <Center>
                <Text as="h3" fontSize="3xl" my={6}>
                  The Science Explorer library has 5 science focus areas
                </Text>
              </Center>
              <Flex direction="row" wrap="wrap" justifyContent="space-evenly" my={8}>
                <SimpleLink href="/astrophysics">
                  <Flex direction="column" alignItems="center">
                    <Image src="/styles/img/disc-astrophysics.png" aria-hidden width="200px" />
                    <Text>Astrophsics</Text>
                  </Flex>
                </SimpleLink>
                <Flex direction="column" alignItems="center">
                  <Image src="/styles/img/disc-heliophysics.jpg" aria-hidden width="200px" />
                  <Text>Heliophysics</Text>
                </Flex>
                <SimpleLink href="/planetary">
                  <Flex direction="column" alignItems="center">
                    <Image src="/styles/img/disc-planetary.jpg" aria-hidden width="200px" />
                    <Text>Planetary Science</Text>
                  </Flex>
                </SimpleLink>
              </Flex>
              <Flex direction="row" wrap="wrap" justifyContent="space-evenly" my={8}>
                <SimpleLink href="/earth">
                  <Flex direction="column" alignItems="center">
                    <Image src="/styles/img/disc-earth.png" aria-hidden width="200px" />
                    <Text>Earth Science</Text>
                  </Flex>
                </SimpleLink>
                <Flex direction="column" alignItems="center">
                  <Image src="/styles/img/disc-biophysical.jpg" aria-hidden width="200px" />
                  <Text>Biological & Physical Science</Text>
                </Flex>
              </Flex>
            </Box>
            <Box fontSize="2xl" my={10}>
              <Center>
                <Text as="h3" fontSize="3xl" my={6}>
                  Telescope
                </Text>
              </Center>
              <HStack gap={10}>
                <Image src="/styles/img/disc-astrophysics.png" w="300px" />
                <Text>
                  data:MAST
                  <br />
                  Instiution: STScI
                </Text>
              </HStack>
            </Box>
            <Box fontSize="2xl" my={10}>
              <Center>
                <Text as="h3" fontSize="3xl" my={6}>
                  Collection
                </Text>
              </Center>
              <HStack gap={10}>
                <Image src="/styles/img/disc-earth.png" w="300px" />
                <Text>collection:earthscience</Text>
              </HStack>
            </Box>
          </Flex>
        </Container>
      </Box>
    </>
  );
};

export default IntroPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
