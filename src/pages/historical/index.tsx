import { ControlledPaginationControls } from '@/components/Pagination';
import { SimpleLink } from '@/components/SimpleLink';
import { NumPerPageType } from '@/types';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Card,
  CardBody,
  CloseButton,
  Container,
  Flex,
  Heading,
  Input,
  Image,
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
import { InfoOutlineIcon } from '@chakra-ui/icons';
import { BookOpenIcon, DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
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
  }, [filteredList, pageSize]);

  useEffect(() => {
    setAccordionIndex(-1);
  }, [pageIndex, pageSize]);

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
          <Flex direction={{ base: 'column', sm: 'row' }} gap={2} my={4}>
            <Button as={SimpleLink} href={`/journalsdb/${bibstem}`} newTab mb={2} variant="outline" gap={2}>
              <InfoOutlineIcon />
              Publication info
            </Button>
            <Button
              as={SimpleLink}
              href={`/scan/search?q=${createQParam(bibstem)}&t=collection`}
              newTab
              mb={2}
              variant="outline"
              gap={2}
            >
              <BookOpenIcon width={24} height={24} aria-hidden />
              Browse all scans
            </Button>
            <Button
              as={SimpleLink}
              href={`/search?d=astrophysics&q=${createQParam(bibstem)}`}
              newTab
              variant="outline"
              gap={2}
            >
              <MagnifyingGlassIcon width={24} height={24} aria-hidden />
              Search publication
            </Button>
          </Flex>
          <Flex gap={2} flexWrap="wrap">
            {volumes.map(({ volume_number }, i) => (
              <Card key={`card-${i}-${bibstem}`}>
                <CardBody>
                  <Heading size="sm" mb={1}>{`Vol ${volume_number}`}</Heading>
                  <Flex direction="column" key={volume_number} p={1} gap={2}>
                    <SimpleLink href={`/scan/search?q=${createQParam(bibstem, volume_number)}&t=page`} newTab>
                      <Flex gap={2}>
                        <DocumentTextIcon width={24} height={24} aria-hidden /> View scans
                      </Flex>
                    </SimpleLink>
                    <SimpleLink href={`/search?d=astrophysics&q=${createQParam(bibstem, volume_number)}`} newTab>
                      <Flex gap={2}>
                        <MagnifyingGlassIcon width={24} height={24} aria-hidden />
                        Search volume
                      </Flex>
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
        <Flex direction="column" gap={8} mb={8}>
          <Heading as="h1">Historical Observatory Publications</Heading>
          <Flex direction={{ base: 'column', md: 'row' }} gap={8} justifyContent="start" alignItems="start">
            <Image src="/images/historical/historical_observatory.png" alt="Historical Observatory" />
            <Text>
              The following publications have been scanned from high-resolution 35mm film and are being made available
              to our users on an &quot;as-is&quot; basis, in collaboration with the John G. Wolbach Library at the{' '}
              <SimpleLink href="https://www.cfa.harvard.edu/">Harvard-Smithsonian Center for Astrophysics</SimpleLink>.
              Funding for this project was provided in part by the Atherton Seidell Fund of the{' '}
              <SimpleLink href="https://www.si.edu/">Smithsonian Institution</SimpleLink>. Please note that these files
              can be viewed and downloaded for personal use only. Any commercial use or large-scale harvesting is
              prohibited.
            </Text>
          </Flex>
        </Flex>

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
