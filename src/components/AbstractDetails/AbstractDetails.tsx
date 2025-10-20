import { IDocsEntity } from '@/api/search/types';
import { EXTERNAL_URLS } from '@/config';
import { getReadablePublDate, pluralize } from '@/utils/common/formatters';
import { ExternalLinkIcon, QuestionIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  Stack,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Tooltip,
  Tr,
  useDisclosure,
  VisuallyHidden,
} from '@chakra-ui/react';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { equals } from 'ramda';
import { isNilOrEmpty } from 'ramda-adjunct';
import { memo, ReactElement, ReactNode } from 'react';
import { createUrlByType } from '../AbstractSources/linkGenerator';
import { SimpleCopyButton } from '../CopyButton';
import { SearchQueryLink } from '../SearchQueryLink';
import { SimpleLink } from '../SimpleLink';
import { AbstractCitationModal } from './AbstractCitationModal';
import { UATDropdown } from './UATDropdown';

interface IDetailsProps {
  doc: IDocsEntity;
}

interface IDetailProps<T = string | Array<string>> {
  label: string | ReactNode;
  href?: string;
  newTab?: boolean;
  value: T;
  copiable?: boolean;
  children?: (value: T) => ReactElement;
}

const shortenKeyword = (keyword: string) => {
  const words = keyword.split('/');
  if (words.length <= 2) {
    return words.join(' > ');
  } else {
    return `${words[0]} > ... > ${words[words.length - 1]}`;
  }
};

export const AbstractDetails = ({ doc }: IDetailsProps): ReactElement => {
  const arxiv = (doc.identifier ?? ([] as string[])).find((v) => /^arxiv/i.exec(v));
  const formattedPublicationDate = doc.pubdate ? getReadablePublDate(doc.pubdate) : '';

  const { isOpen: isCitationOpen, onOpen: onCitationOpen, onClose: onCitationClose } = useDisclosure();

  return (
    <Box as="section" border="1px" borderColor="gray.50" borderRadius="md" shadow="sm" aria-labelledby="details">
      <VisuallyHidden as="h2" id="details">
        Details
      </VisuallyHidden>
      <Table colorScheme="gray" size="md" role="presentation">
        <Tbody>
          <Detail label="Publication" value={doc.pub_raw}>
            {(pub_raw) => (
              <>
                <span dangerouslySetInnerHTML={{ __html: pub_raw }}></span>
                <Tooltip label="Copy citation">
                  <Button
                    aria-label="Copy citation"
                    variant="outline"
                    mx={2}
                    cursor="pointer"
                    size="xs"
                    onClick={onCitationOpen}
                  >
                    <FontAwesomeIcon icon={faQuoteLeft} size="xs" />
                  </Button>
                </Tooltip>
              </>
            )}
          </Detail>
          <Detail label="Book Author(s)" value={doc.book_author} />
          <Detail label="Publication Date" value={formattedPublicationDate} />
          <Detail label="DOI" value={doc.doi}>
            {(doi) => <Doi doiIDs={doi} bibcode={doc.bibcode} />}
          </Detail>
          <Detail
            label="arXiv"
            value={arxiv}
            href={createUrlByType(doc?.bibcode, 'arxiv', arxiv?.split(':')[1])}
            newTab
          />
          <Detail label="Bibcode" value={doc.bibcode} copiable />
          <Collections collections={doc.database ?? []} />
          <Keywords keywords={doc.keyword} />
          <UATKeywords keywords={doc.uat} ids={doc.uat_id} />
          <Bibgroups bibgroups={doc.bibgroup ?? []} />
          <PlanetaryFeatures features={doc.planetary_feature} ids={doc.planetary_feature_id} />
          <Detail label="Comment(s)" value={doc.comment} />
          <Detail label="E-Print Comment(s)" value={doc.pubnote} />
        </Tbody>
      </Table>
      <AbstractCitationModal isOpen={isCitationOpen} onClose={onCitationClose} bibcode={doc?.bibcode} />
    </Box>
  );
};

// TODO: this should take in a list of deps or the whole doc and show/hide based on that
const Detail = <T extends string | string[]>(props: IDetailProps<T>): ReactElement => {
  const { label, href, newTab = false, value, copiable = false, children } = props;

  // show nothing if no value
  if (isNilOrEmpty(value)) {
    return null;
  }

  const normalizedValue: string = Array.isArray(value) ? value.join('; ') : value;

  return (
    <Tr>
      <Td>{label}</Td>
      <Td wordBreak="break-word">
        {href && (
          <SimpleLink href={href} newTab={newTab}>
            {normalizedValue}
          </SimpleLink>
        )}
        {typeof children === 'function'
          ? children(value)
          : !href && <span dangerouslySetInnerHTML={{ __html: normalizedValue }} />}
        {copiable && (
          <Tooltip label="Copy" shouldWrapChildren>
            <SimpleCopyButton text={normalizedValue as string} size="xs" variant="outline" mx={2} />
          </Tooltip>
        )}
      </Td>
    </Tr>
  );
};

const Doi = memo(({ doiIDs, bibcode }: { doiIDs: Array<string>; bibcode: string }) => {
  if (isNilOrEmpty(bibcode)) {
    return null;
  }
  return (
    <>
      {doiIDs.map((id) => (
        <Stack direction="row" my={1} key={id}>
          <Tooltip
            label={
              <>
                Open DOI link <ExternalLinkIcon />
              </>
            }
          >
            <SimpleLink href={createUrlByType(bibcode, 'doi', id)} newTab _hover={{ textDecor: 'underline' }}>
              {id}
            </SimpleLink>
          </Tooltip>
          <Tooltip label="Copy DOI" shouldWrapChildren>
            <SimpleCopyButton text={id} variant="outline" size="xs" />
          </Tooltip>
        </Stack>
      ))}
    </>
  );
}, equals);
Doi.displayName = 'Doi';

const Keywords = memo(({ keywords }: { keywords: Array<string> }) => {
  const label = `Search for papers that mention this keyword`;
  return (
    <Detail label={pluralize('Keyword', keywords?.length ?? 0)} value={keywords}>
      {(keywords) => (
        <Flex flexWrap={'wrap'}>
          {keywords.map((keyword) => (
            <Tag size="md" variant="subtle" whiteSpace="nowrap" m="1" px={2} py={1} key={keyword}>
              <HStack spacing="1">
                <Text>{keyword}</Text>
                <SearchQueryLink
                  params={{ q: `keyword:"${keyword}"` }}
                  textDecoration="none"
                  _hover={{
                    color: 'gray.900',
                  }}
                  aria-label={label}
                  fontSize="md"
                >
                  <Tooltip label={label}>
                    <Center>
                      <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                    </Center>
                  </Tooltip>
                </SearchQueryLink>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
Keywords.displayName = 'Keywords';

const UATKeywords = memo(({ keywords, ids }: { keywords: Array<string>; ids: Array<number> }) => {
  const desc = `Search for papers that mention this keyword`;
  const label = (
    <>
      {`UAT ${pluralize('Keyword', keywords?.length ?? 0)} (generated)`}
      <Badge colorScheme="blue" mx={1}>
        BETA
      </Badge>
    </>
  );
  return (
    <Detail label={label} value={keywords}>
      {(keywords) => (
        <Flex flexWrap={'wrap'}>
          {keywords.map((keyword, index) => (
            <Tag size="md" variant="subtle" whiteSpace="nowrap" m="1" px={2} py={1} key={keyword}>
              <HStack spacing="1">
                <Tooltip label={keyword}>
                  <SimpleLink href={`https://astrothesaurus.org/uat/${encodeURIComponent(ids[index])}`} newTab>
                    {shortenKeyword(keyword)}
                  </SimpleLink>
                </Tooltip>
                <SearchQueryLink
                  params={{ q: `uat:"${keyword.split('/').pop()}"` }}
                  textDecoration="none"
                  _hover={{
                    color: 'gray.900',
                  }}
                  aria-label={desc}
                  fontSize="md"
                >
                  <Tooltip label={desc}>
                    <Center>
                      <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                    </Center>
                  </Tooltip>
                </SearchQueryLink>
                <UATDropdown keyword={keyword} />
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
UATKeywords.displayName = 'UATKeywords';

const Collections = memo(({ collections }: { collections: Array<string> }) => {
  const label = `Search for papers in this collection`;
  return (
    <Detail label={pluralize('Collection', collections?.length ?? 0)} value={collections}>
      {(collections) => (
        <Flex flexWrap={'wrap'}>
          {collections.map((collection) => (
            <Tag size="md" variant="subtle" whiteSpace="nowrap" m="1" key={collection}>
              <HStack spacing="2">
                <Text>{collection}</Text>
                <SearchQueryLink
                  params={{ q: `collection:"${collection}"` }}
                  textDecoration="none"
                  _hover={{
                    color: 'gray.900',
                  }}
                  aria-label={label}
                  fontSize="md"
                >
                  <Tooltip label={label}>
                    <Center>
                      <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                    </Center>
                  </Tooltip>
                </SearchQueryLink>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
Collections.displayName = 'Collections';

const Bibgroups = memo(({ bibgroups }: { bibgroups: Array<string> }) => {
  const label = `Search for papers in this bibgroup`;
  return (
    <Detail
      label={
        <>
          {pluralize('Bibgroup', bibgroups?.length ?? 0)}
          <Tooltip
            label={
              <>
                Click to learn about bibgroups <ExternalLinkIcon />
              </>
            }
          >
            <SimpleLink href="https://scixplorer.org/scixhelp/data_faq-scix/Bibgroups">
              <QuestionIcon ml={2} />
            </SimpleLink>
          </Tooltip>
        </>
      }
      value={bibgroups}
    >
      {(bibgroups) => (
        <Flex flexWrap={'wrap'}>
          {bibgroups.map((bibgroup) => (
            <Tag size="md" variant="subtle" whiteSpace="nowrap" m="1" key={bibgroup}>
              <HStack spacing="2">
                <Text>{bibgroup}</Text>
                <SearchQueryLink
                  params={{ q: `bibgroup:"${bibgroup}"` }}
                  textDecoration="none"
                  _hover={{
                    color: 'gray.900',
                  }}
                  aria-label={label}
                  fontSize="md"
                >
                  <Tooltip label={label}>
                    <Center>
                      <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                    </Center>
                  </Tooltip>
                </SearchQueryLink>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
Bibgroups.displayName = 'Bibgroups';

const PlanetaryFeatures = memo(({ features, ids }: { features: Array<string>; ids: Array<string> }) => {
  const label = `Search for papers that mention this feature`;
  const usgsLabel = `Go to the USGS page for this feature`;
  if (isNilOrEmpty(features) || isNilOrEmpty(ids)) {
    return null;
  }
  return (
    <Detail label={pluralize('Planetary Feature', features?.length ?? 0)} value={features}>
      {(features) => (
        <Flex flexWrap={'wrap'}>
          {features.map((feature, index) => (
            <Tag size="md" variant="subtle" whiteSpace="nowrap" m="1" px={2} py={1} key={feature}>
              <HStack spacing="1">
                <SimpleLink
                  href={`${EXTERNAL_URLS.USGS_PLANETARY_FEATURES}${ids[index]}`}
                  aria-label={usgsLabel}
                  newTab
                  _hover={{ textDecor: 'underline' }}
                >
                  {feature.replaceAll('/', ' > ')}
                </SimpleLink>
                <HStack spacing="1">
                  <SearchQueryLink
                    params={{ q: `planetary_feature:"${feature}"` }}
                    textDecoration="none"
                    _hover={{
                      color: 'gray.900',
                    }}
                    aria-label={label}
                    fontSize="md"
                  >
                    <Tooltip label={label}>
                      <Center>
                        <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                      </Center>
                    </Tooltip>
                  </SearchQueryLink>
                </HStack>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
PlanetaryFeatures.displayName = 'PlanetaryFeatures';
