import { IDocsEntity } from '@api';
import { Checkbox, CheckboxProps } from '@chakra-ui/checkbox';
import { Box, Flex, Link, Stack, Text } from '@chakra-ui/layout';
import { BoxProps, CircularProgress, Fade, useTimeout } from '@chakra-ui/react';
import { AllAuthorsModal } from '@components/AllAuthorsModal';
import { APP_DEFAULTS } from '@config';
import { useIsClient } from '@lib/useIsClient';
import { useStore } from '@store';
import { getFomattedNumericPubdate, noop, unwrapStringValue } from '@utils';
import { MathJax } from 'better-react-mathjax';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { ChangeEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import shallow from 'zustand/shallow';
import { IAbstractPreviewProps } from './AbstractPreview';
import { ItemResourceDropdowns } from './ItemResourceDropdowns';

const AbstractPreview = dynamic<IAbstractPreviewProps>(
  () => import('./AbstractPreview').then((mod) => mod.AbstractPreview),
  { ssr: false },
);
export interface IItemProps {
  doc: IDocsEntity;
  index: number;
  hideCheckbox: boolean;
  hideActions: boolean;
  set?: boolean;
  clear?: boolean;
  onSet?: (check: boolean) => void;
  useNormCite?: boolean;
  showHighlights?: boolean;
  isFetchingHighlights?: boolean;
  highlights?: string[];
  extraInfo?: string;
  linkNewTab?: boolean;
  showOrcidAction?: boolean;
  orcidClaimed?: boolean;
  onAddClaim?: (identifier: string) => void;
  onDeleteClaim?: (identifier: string) => void;
}

export const Item = (props: IItemProps): ReactElement => {
  const {
    doc,
    index,
    hideCheckbox = false,
    hideActions = false,
    useNormCite,
    showHighlights,
    isFetchingHighlights,
    highlights,
    extraInfo,
    linkNewTab = false,
    showOrcidAction = false,
    orcidClaimed = false,
    onAddClaim = noop,
    onDeleteClaim = noop,
  } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], bibstem = [], author_count } = doc;
  const formattedPubDate = getFomattedNumericPubdate(pubdate);
  const [formattedBibstem] = bibstem;
  const isClient = useIsClient();

  // memoize the isSelected callback on bibcode
  const isChecked = useStore(useCallback((state) => state.isDocSelected(bibcode), [bibcode]));

  // citations
  const cite = useNormCite ? (
    typeof doc.citation_count_norm === 'number' && doc.citation_count_norm > 0 ? (
      <NextLink
        href={{ pathname: `/abs/[id]/citations`, search: 'p=1' }}
        as={{ pathname: `/abs/${bibcode}/citations`, search: 'p=1' }}
        passHref
        legacyBehavior
      >
        <Link target={linkNewTab ? '_blank' : '_self'} rel={linkNewTab ? 'noopener noreferrer' : ''}>
          <Text>cited(n): {doc.citation_count_norm}</Text>
        </Link>
      </NextLink>
    ) : null
  ) : typeof doc.citation_count === 'number' && doc.citation_count > 0 ? (
    <NextLink
      href={{ pathname: `/abs/[id]/citations`, search: 'p=1' }}
      as={{ pathname: `/abs/${bibcode}/citations`, search: 'p=1' }}
      passHref
      legacyBehavior
    >
      <Link target={linkNewTab ? '_blank' : '_self'} rel={linkNewTab ? 'noopener noreferrer' : ''}>
        cited: {doc.citation_count}
      </Link>
    </NextLink>
  ) : null;

  const handleAddClaim = () => {
    onAddClaim(doc.identifier[0]);
  };

  const handleDeleteClaim = () => {
    onDeleteClaim(doc.identifier[0]);
  };

  return (
    <Flex direction="row" as="article" border="1px" borderColor="gray.50" mb={1} borderRadius="md">
      <Flex
        direction="row"
        backgroundColor={isChecked ? 'blue.500' : 'gray.50'}
        justifyContent="center"
        alignItems="center"
        mr="2"
        px="2"
        borderLeftRadius="md"
        className="print-hidden"
      >
        <Text
          color={isChecked ? 'white' : 'initial'}
          display={{ base: 'none', md: 'initial' }}
          mr={1}
          data-testid="results-index"
        >
          {index.toLocaleString()}
        </Text>
        {hideCheckbox ? null : <ItemCheckbox index={index} bibcode={bibcode} label={title} isChecked={isChecked} />}
      </Flex>
      <Stack direction="column" width="full" spacing={0} mx={3} mt={2}>
        <Flex justifyContent="space-between">
          <NextLink href={`/abs/[id]/abstract`} as={`/abs/${bibcode}/abstract`} passHref legacyBehavior>
            <Link
              fontWeight="semibold"
              target={linkNewTab ? '_blank' : '_self'}
              rel={linkNewTab ? 'noopener noreferrer' : ''}
            >
              <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
            </Link>
          </NextLink>
          <Flex alignItems="start" ml={1}>
            {!isClient || hideActions ? null : (
              <ItemResourceDropdowns
                doc={doc}
                orcidClaimed={orcidClaimed}
                showOrcidAction={showOrcidAction}
                onAddClaim={handleAddClaim}
                onDeleteClaim={handleDeleteClaim}
              />
            )}
          </Flex>
        </Flex>
        <Flex direction="column">
          <AuthorList author={author} authorCount={author_count} bibcode={doc.bibcode} />
          <Text fontSize="xs" mt={0.5}>
            {formattedPubDate}
            {formattedPubDate && formattedBibstem ? <span className="px-2">·</span> : ''}
            {formattedBibstem}
            {cite && (formattedPubDate || formattedBibstem) ? <span className="px-2">·</span> : null}
            {cite}
            {cite && extraInfo && '; '}
            {extraInfo}
          </Text>
          {showHighlights && <Highlights highlights={highlights} isFetchingHighlights={isFetchingHighlights} />}
          <AbstractPreview bibcode={bibcode} />
        </Flex>
      </Stack>
    </Flex>
  );
};

/**
 * Highlights view
 */
const Highlights = ({
  highlights,
  isFetchingHighlights,
}: Pick<IItemProps, 'highlights' | 'isFetchingHighlights'>): ReactElement => {
  const [showIndicator, setShowIndicator] = useState(false);

  // hide indicator for a period of time, in case the server respond quickly
  useTimeout(() => {
    if (isFetchingHighlights) {
      setShowIndicator(true);
    }
  }, 1000);

  // reset indicator state
  useEffect(() => {
    if (highlights) {
      setShowIndicator(false);
    }
  }, [highlights]);

  return (
    <Box as="section" aria-label="highlights" className="search-snippets" my={2} data-testid="highlights-section">
      {isFetchingHighlights || !highlights ? (
        showIndicator && <CircularProgress mt={5} isIndeterminate size="20px" />
      ) : (
        <Fade in={!!highlights}>
          {highlights.length > 0 ? (
            highlights.map((hl, index) => <Text key={`hl-${index}`} dangerouslySetInnerHTML={{ __html: hl }}></Text>)
          ) : (
            <Text color="blackAlpha.500">No Highlights</Text>
          )}
        </Fade>
      )}
    </Box>
  );
};

interface IItemCheckboxProps extends CheckboxProps {
  index: number;
  bibcode: string;
  label: string[];
  isChecked: boolean;
}

const ItemCheckbox = (props: IItemCheckboxProps) => {
  const { index, bibcode, label, isChecked, ...checkboxProps } = props;

  const [selectDoc, unSelectDoc] = useStore((state) => [state.selectDoc, state.unSelectDoc], shallow);

  // on select, update the local state and appState
  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    checked ? selectDoc(bibcode) : unSelectDoc(bibcode);
  };

  return (
    <Checkbox
      name={`result-checkbox-${index}`}
      id={`result-checkbox-${index}`}
      onChange={handleSelect}
      isChecked={isChecked}
      aria-label={`${isChecked ? 'De-select' : 'Select'} item ${label[0]}`}
      size="md"
      data-testid="results-checkbox"
      {...checkboxProps}
    />
  );
};

interface IAuthorListProps extends BoxProps {
  author: IDocsEntity['author'];
  authorCount: IDocsEntity['author_count'];
  bibcode: IDocsEntity['bibcode'];
}

const MAX_AUTHORS = APP_DEFAULTS.RESULTS_MAX_AUTHORS;
/**
 * Displays author list and includes a button to open all authors modal
 */
const AuthorList = (props: IAuthorListProps): ReactElement => {
  const { author, authorCount, bibcode, ...boxProps } = props;

  if (authorCount === 0) {
    return null;
  }

  return (
    <Box fontSize="sm" {...boxProps}>
      {author.slice(0, MAX_AUTHORS).join('; ')}
      {'; '}
      {authorCount > MAX_AUTHORS ? (
        <AllAuthorsModal bibcode={bibcode} label={`and ${authorCount - MAX_AUTHORS} more`} />
      ) : (
        <AllAuthorsModal bibcode={bibcode} label={'show list'} />
      )}
    </Box>
  );
};
