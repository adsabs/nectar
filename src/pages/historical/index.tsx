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
  CloseButton,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';
import histLitList from 'public/data/hist_lit/histLitList.json';
import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/lib/useDebounce';
import { APP_DEFAULTS } from '@/config';
interface HistoricalPublication {
  label: string;
  bibstem: string;
  volumes: { volume_number: string }[];
}

const HistoricalLitPage: NextPage = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const [pageSize, setPageSize] = useState<NumPerPageType>(APP_DEFAULTS.RESULT_PER_PAGE);

  const [accordionIndex, setAccordionIndex] = useState<number | number[]>(-1);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const createQParam = (bibstem: string, volume?: string) => {
    return !!volume
      ? `${encodeURIComponent(`bibstem:${bibstem}`)}+${encodeURIComponent(`volume:${volume}`)}`
      : encodeURIComponent(`bibstem:${bibstem}`);
  };

  const startRow = useMemo(() => {
    return pageIndex * pageSize;
  }, [pageIndex, pageSize]);

  const filteredList = useMemo<HistoricalPublication[]>(() => {
    if (!debouncedSearchTerm) {
      return histLitList;
    }
    return histLitList.filter(({ label, bibstem }) => {
      return (
        label.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        bibstem.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    });
  }, [debouncedSearchTerm]);

  const pagedFilteredList = useMemo<HistoricalPublication[]>(() => {
    return filteredList.slice(startRow, startRow + pageSize);
  }, [filteredList, startRow, pageSize]);

  // reset page index to 0 whenever the filtered list changes
  // so that users don't end up on an empty page
  useEffect(() => {
    setPageIndex(0);
    setAccordionIndex(-1);
  }, [filteredList]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Improve the performance of the rendered list by memoizing it and only re-rendering when the paged filtered list changes
  const renderedList = useMemo(() => {
    return pagedFilteredList.map(({ label, bibstem, volumes }) => (
      <AccordionItem key={`accordion-${bibstem}`} p={1}>
        <AccordionButton>
          <Heading as="h2" size="sm" flex="1" textAlign="left">
            {label}
            <Text my={2} fontWeight="normal">{`Bibstem: ${bibstem} | Volumes: ${volumes.length}`}</Text>
          </Heading>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <SimpleLink href="" newTab>
            View Bibstem in Journals Database
          </SimpleLink>
          <Flex gap={2} flexWrap="wrap">
            <Card key={`card-all-vols-${bibstem}`}>
              <CardBody>
                <Heading size="sm">All Volumes</Heading>
                <Flex direction="column" key="all" p={1} gap={2}>
                  <SimpleLink href={`/scan/search?q=${createQParam(bibstem)}&t=collection`} newTab>
                    Scan Explorer
                  </SimpleLink>
                  <SimpleLink href={`/search?d=astrophysics&q=${createQParam(bibstem)}`} newTab>
                    Search Results
                  </SimpleLink>
                </Flex>
              </CardBody>
            </Card>
            {volumes.map(({ volume_number }, i) => (
              <Card key={`card-${i}-${bibstem}`}>
                <CardBody>
                  <Heading size="sm">{`Vol ${volume_number}`}</Heading>
                  <Flex direction="column" key={volume_number} p={1} gap={2}>
                    <SimpleLink href={`/scan/search?q=${createQParam(bibstem, volume_number)}&t=page`} newTab>
                      Scan Explorer
                    </SimpleLink>
                    <SimpleLink href={`/search?d=astrophysics&q=${createQParam(bibstem, volume_number)}`} newTab>
                      Search Results
                    </SimpleLink>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Flex>
        </AccordionPanel>
      </AccordionItem>
    ));
  }, [pagedFilteredList]);

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
        <InputGroup>
          <Input
            placeholder="Search by publication name or bibstem"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            type="search"
          />
          <InputRightElement>
            <CloseButton aria-label="Clear search" onClick={handleClearSearch} />
          </InputRightElement>
        </InputGroup>
        <Accordion
          my={4}
          allowToggle
          as="section"
          aria-label="Historical Observatory Publications list"
          index={accordionIndex}
          onChange={(index) => setAccordionIndex(index)}
        >
          {renderedList}
        </Accordion>
        <ControlledPaginationControls
          entries={filteredList.length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onChangePageSize={setPageSize}
          onChangePageIndex={setPageIndex}
        />
      </Container>
    </>
  );
};

export default HistoricalLitPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
