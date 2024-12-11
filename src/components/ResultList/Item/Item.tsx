import {
  Box,
  BoxProps,
  Checkbox,
  CheckboxProps,
  CircularProgress,
  Fade,
  Flex,
  Stack,
  Text,
  Tooltip,
  useTimeout,
} from '@chakra-ui/react';
import { AllAuthorsModal } from '@/components/AllAuthorsModal';
import { APP_DEFAULTS } from '@/config';
import { useIsClient } from '@/lib/useIsClient';
import { useStore } from '@/store';
import { MathJax } from 'better-react-mathjax';
import dynamic from 'next/dynamic';
import { ChangeEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import shallow from 'zustand/shallow';
import { IAbstractPreviewProps } from './AbstractPreview';
import { ItemResourceDropdowns } from './ItemResourceDropdowns';

import { HideOnPrint } from '@/components/HideOnPrint';
import { SimpleLink } from '@/components/SimpleLink';
import { useColorModeColors } from '@/lib/useColorModeColors';

import { getFormattedNumericPubdate, unwrapStringValue } from '@/utils/common/formatters';
import { IDocsEntity } from '@/api/search/types';

const AbstractPreview = dynamic<IAbstractPreviewProps>(
  () =>
    import('./AbstractPreview').then((mod) => ({
      default: mod.AbstractPreview,
    })),
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
  defaultCitation: string;
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
    defaultCitation = '',
  } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], author_count, pub } = doc;
  const formattedPubDate = getFormattedNumericPubdate(pubdate);
  const isClient = useIsClient();
  const truncatedPub =
    pub?.length > APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF ? pub.slice(0, APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF) + '...' : pub;

  // memoize the isSelected callback on bibcode
  const isChecked = useStore(useCallback((state) => state.isDocSelected(bibcode), [bibcode]));

  const colors = useColorModeColors();

  // citations
  const cite = useNormCite ? (
    typeof doc.citation_count_norm === 'number' && doc.citation_count_norm > 0 ? (
      <SimpleLink href={{ pathname: `/abs/${bibcode}/citations`, search: 'p=1' }} newTab={linkNewTab}>
        <Text>cited(n): {doc.citation_count_norm.toFixed(2)}</Text>
      </SimpleLink>
    ) : null
  ) : typeof doc.citation_count === 'number' && doc.citation_count > 0 ? (
    <SimpleLink href={{ pathname: `/abs/${bibcode}/citations`, search: 'p=1' }} newTab={linkNewTab}>
      cited: {doc.citation_count}
    </SimpleLink>
  ) : null;

  return (
    <Flex direction="row" as="article" border="1px" borderColor={colors.border} mb={1} borderRadius="md">
      <Flex
        as={HideOnPrint}
        direction="row"
        backgroundColor={isChecked ? colors.panelHighlight : colors.panel}
        justifyContent="center"
        alignItems="center"
        mr="2"
        px="2"
        borderLeftRadius="md"
        w="64px"
      >
        <Text
          color={isChecked ? colors.background : 'initial'}
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
          <SimpleLink href={`/abs/${bibcode}/abstract`} fontWeight="semibold">
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
          </SimpleLink>
          <Flex alignItems="start" ml={1}>
            {!isClient || hideActions ? null : <ItemResourceDropdowns doc={doc} defaultCitation={defaultCitation} />}
          </Flex>
        </Flex>
        <Flex direction="column">
          {author_count > 0 && <AuthorList author={author} authorCount={author_count} bibcode={doc.bibcode} />}
          <Flex fontSize="xs" mt={0.5}>
            {formattedPubDate}
            {formattedPubDate && pub ? <Text px="2">·</Text> : ''}
            <Tooltip label={pub} aria-label="publication tooltip" placement="top">
              <span>{truncatedPub}</span>
            </Tooltip>
            {cite && (formattedPubDate || pub) ? <Text px="2">·</Text> : null}
            {cite}
            {cite && extraInfo && '; '}
            {extraInfo}
          </Flex>
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
    <Box as="section" aria-label="highlights" fontStyle="italics" my={2} data-testid="highlights-section">
      {isFetchingHighlights || !highlights ? (
        showIndicator && <CircularProgress mt={5} isIndeterminate size="20px" />
      ) : (
        <Fade in={!!highlights}>
          {highlights.length > 0 ? (
            highlights.map((hl) => (
              <Text
                sx={{
                  // Apply a style to the <em> tag, which is included in the highlight string
                  '& em': {
                    backgroundColor: 'blue.100',
                    color: 'gray.800',
                    padding: 'var(--chakra-space-1)',
                    fontWeight: 'bold',
                  },
                }}
                key={hl}
                dangerouslySetInnerHTML={{ __html: hl }}
              ></Text>
            ))
          ) : (
            <Text>No Highlights</Text>
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
        <AllAuthorsModal bibcode={bibcode} label={'show details'} />
      )}
    </Box>
  );
};
