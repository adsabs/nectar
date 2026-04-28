import { ControlledPaginationControls } from '@/components/Pagination';
import { SimpleLink } from '@/components/SimpleLink';
import { NumPerPageType } from '@/types';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Card,
  CardBody,
  Container,
  Flex,
  Heading,
  Text,
} from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import histLitList from 'public/data/hist_lit/histLitList.json';
import { useEffect, useState } from 'react';

const HistoricalLitPage: NextPage = () => {
  const router = useRouter();

  const { p, size } = router.query;

  const pageIndex = p ? parseInt(p as string, 10) - 1 : 0;

  const pageSize: NumPerPageType = size ? (parseInt(size as string, 10) as NumPerPageType) : 10;

  const startRow = pageIndex * pageSize;

  const data = histLitList.slice(startRow, startRow + pageSize);

  const [accordionIndex, setAccordionIndex] = useState<number | number[]>(-1);

  const handleChangePageSize = (size: NumPerPageType) => {
    router.push({ pathname: '/historical', query: { p: pageIndex + 1, size } });
  };

  const createQParam = (bibstem: string, volume: string) => {
    return `${encodeURIComponent(`bibstem:${bibstem}`)}+${encodeURIComponent(`volume:${volume}`)}`;
  };

  const handleChangePageIndex = (index: number) => {
    router.push({ pathname: '/historical', query: { p: index + 1, size: pageSize } });
  };

  useEffect(() => {
    setAccordionIndex(-1);
  }, [router.query]);

  return (
    <>
      <Head>
        <title>Historical Observatory Publications</title>
      </Head>
      <Container maxW="container.lg" my={4} minH="container.sm">
        <Heading as="h1" my={8}>
          Historical Observatory Publications
        </Heading>
        <Text aria-label="Historical Observatory Publications description" my={8}>
          The following publications have been scanned from high-resolution 35mm film and are being made available to
          our users on an &quot;as-is&quot; basis, in collaboration with the John G. Wolbach Library at the{' '}
          <SimpleLink href="https://www.cfa.harvard.edu/">Harvard-Smithsonian Center for Astrophysics</SimpleLink>.
          Funding for this project was provided in part by the Atherton Seidell Fund of the{' '}
          <SimpleLink href="https://www.si.edu/">Smithsonian Institution</SimpleLink>. Please note that these files can
          be viewed and downloaded for personal use only. Any commercial use or large-scale harvesting is prohibited.
        </Text>
        <Accordion
          my={4}
          allowMultiple
          allowToggle
          key={pageIndex}
          as="section"
          aria-label="Historical Observatory Publications list"
          index={accordionIndex}
          onChange={(index) => setAccordionIndex(index)}
        >
          {data.map(({ label, bibstem, volumes }) => (
            <AccordionItem key={`accordion-${bibstem}`} p={1}>
              <AccordionButton>
                <Heading as="h2" size="sm" flex="1" textAlign="left">
                  {label}
                  <Text my={2} fontWeight="normal">{`Bibstem: ${bibstem} | Volumes: ${volumes.length}`}</Text>
                </Heading>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <Flex gap={2} flexWrap="wrap">
                  {volumes.map(({ volume_number }) => (
                    <Card key={`card-${bibstem}-${volume_number}`}>
                      <CardBody>
                        <Heading size="sm">{`Vol ${volume_number}`}</Heading>
                        <Flex direction="column" key={volume_number} p={1} gap={2}>
                          <SimpleLink href={`/scan/search?q=${createQParam(bibstem, volume_number)}`}>
                            Scan Explorer
                          </SimpleLink>
                          <SimpleLink href={`/scan/search?q=${createQParam(bibstem, volume_number)}`}>
                            Download PDF
                          </SimpleLink>
                          <SimpleLink href={`/search?d=astrophysics&q=${createQParam(bibstem, volume_number)}`}>
                            Search Results
                          </SimpleLink>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Flex>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
        <ControlledPaginationControls
          entries={histLitList.length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onChangePageSize={handleChangePageSize}
          onChangePageIndex={handleChangePageIndex}
        />
      </Container>
    </>
  );
};

export default HistoricalLitPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
