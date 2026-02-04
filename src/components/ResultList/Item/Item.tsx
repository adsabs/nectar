import {
  Box,
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
import { AuthorList } from '@/components/AllAuthorsModal';
import { APP_DEFAULTS } from '@/config';
import { useAuthorsPerResult } from '@/lib/useAuthorsPerResult';
import { useIsClient } from '@/lib/useIsClient';
import { useScrollRestoration } from '@/lib/useScrollRestoration';
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
import { keys, toPairs } from 'ramda';

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
  highlights?: Record<string, string[]>;
  extraInfo?: string;
  linkNewTab?: boolean;
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
  } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], author_count, pub } = doc;
  const encodedCanonicalID = bibcode ? encodeURIComponent(bibcode) : '';
  const formattedPubDate = getFormattedNumericPubdate(pubdate);
  const isClient = useIsClient();
  const maxAuthors = useAuthorsPerResult();
  const truncatedPub =
    pub?.length > APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF ? pub.slice(0, APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF) + '...' : pub;

  // memoize the isSelected callback on bibcode
  const isChecked = useStore(useCallback((state) => state.isDocSelected(bibcode), [bibcode]));

  const colors = useColorModeColors();

  // Scroll restoration - save position when navigating to abstract
  const { saveScrollPosition } = useScrollRestoration();

  // citations
  const cite = useNormCite ? (
    typeof doc.citation_count_norm === 'number' && doc.citation_count_norm > 0 ? (
      <SimpleLink
        href={{ pathname: `/abs/${encodedCanonicalID}/citations`, search: 'p=1' }}
        newTab={linkNewTab}
        onClick={saveScrollPosition}
      >
        <Text>cited(n): {doc.citation_count_norm.toFixed(2)}</Text>
      </SimpleLink>
    ) : null
  ) : typeof doc.citation_count === 'number' && doc.citation_count > 0 ? (
    <SimpleLink
      href={{ pathname: `/abs/${encodedCanonicalID}/citations`, search: 'p=1' }}
      newTab={linkNewTab}
      onClick={saveScrollPosition}
    >
      cited: {doc.citation_count}
    </SimpleLink>
  ) : null;

  // credited
  const credited =
    Array.isArray(doc.credit) && doc.credit.length > 0 ? (
      <SimpleLink
        href={{ pathname: `/abs/${encodedCanonicalID}/credits`, search: 'p=1' }}
        newTab={linkNewTab}
        onClick={saveScrollPosition}
      >
        credited: {doc.credit.length}
      </SimpleLink>
    ) : null;

  return (
    <Flex direction="row" as="article" border="1px" borderColor={colors.border} mb={1} borderRadius="md" id={bibcode}>
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
        <Flex justifyContent="space-between" minH="40px">
          <SimpleLink
            href={`/abs/${encodedCanonicalID}/abstract`}
            fontWeight="semibold"
            className="article-title"
            onClick={saveScrollPosition}
          >
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
          </SimpleLink>
          <Flex alignItems="start" ml={1}>
            {!isClient || hideActions ? null : <ItemResourceDropdowns doc={doc} />}
          </Flex>
        </Flex>
        <Flex direction="column">
          {author_count > 0 && (
            <AuthorList author={author} authorCount={author_count} bibcode={doc.bibcode} maxAuthors={maxAuthors} />
          )}
          <Flex fontSize="xs" mt={0.5}>
            {formattedPubDate}
            {formattedPubDate && pub ? <Text px="2">·</Text> : ''}
            <Tooltip label={pub} aria-label="publication tooltip" placement="top">
              <span>{truncatedPub}</span>
            </Tooltip>
            {cite && (formattedPubDate || pub) ? <Text px="2">·</Text> : null}
            {cite}
            {!!credited && (
              <>
                <Text px="2">·</Text>
                {credited}
              </>
            )}
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
          {keys(highlights).length > 0 ? (
            toPairs(highlights).map(([key, hls]) => (
              <>
                <Text fontSize="sm" fontWeight="semibold">
                  {key.toLocaleUpperCase()}
                </Text>
                {hls.map((hl) => (
                  <Text
                    ml={2}
                    my={1}
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
                ))}
              </>
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
