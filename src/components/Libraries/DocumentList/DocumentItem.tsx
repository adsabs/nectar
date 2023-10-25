import { IDocsEntity } from '@api';
import { Box, BoxProps, Checkbox, CheckboxProps, Flex, Link, Stack, Text } from '@chakra-ui/react';
import { AllAuthorsModal } from '@components/AllAuthorsModal';
import { IAbstractPreviewProps, ItemResourceDropdowns } from '@components/ResultList/Item';
import { APP_DEFAULTS } from '@config';
import { useIsClient } from '@lib/useIsClient';
import { getFomattedNumericPubdate, noop, unwrapStringValue } from '@utils';
import { MathJax } from 'better-react-mathjax';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { ChangeEvent, ReactElement } from 'react';

const AbstractPreview = dynamic<IAbstractPreviewProps>(
  () => import('@components/ResultList/Item/AbstractPreview').then((mod) => mod.AbstractPreview),
  { ssr: false },
);
export interface IItemProps {
  doc: IDocsEntity;
  index: number;
  hideCheckbox: boolean;
  isChecked?: boolean;
  onSet?: (check: boolean) => void;
  useNormCite?: boolean;
  linkNewTab?: boolean;
  hideResources?: boolean;
}

export const DocumentItem = (props: IItemProps): ReactElement => {
  const {
    doc,
    index,
    hideCheckbox,
    isChecked = false,
    onSet = noop,
    useNormCite,
    linkNewTab = false,
    hideResources = true,
  } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], bibstem = [], author_count } = doc;
  const formattedPubDate = getFomattedNumericPubdate(pubdate);
  const [formattedBibstem] = bibstem;
  const isClient = useIsClient();

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
        <Text color={isChecked ? 'white' : 'initial'} display={{ base: 'none', md: 'initial' }} mr={1}>
          {index.toLocaleString()}
        </Text>
        {!hideCheckbox && <ItemCheckbox index={index} label={title} isChecked={isChecked} onSet={onSet} />}
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
            {!isClient || hideResources ? null : <ItemResourceDropdowns doc={doc} />}
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
          </Text>
          <AbstractPreview bibcode={bibcode} />
        </Flex>
      </Stack>
    </Flex>
  );
};

interface IItemCheckboxProps extends CheckboxProps {
  index: number;
  label: string[];
  isChecked: boolean;
  onSet: (checked: boolean) => void;
}

const ItemCheckbox = (props: IItemCheckboxProps) => {
  const { index, label, isChecked, onSet, ...checkboxProps } = props;

  // on select, update the local state and appState
  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onSet(checked);
  };

  return (
    <Checkbox
      name={`libdoc-checkbox-${index}`}
      id={`libdoc-checkbox-${index}`}
      onChange={handleSelect}
      isChecked={isChecked}
      aria-label={`${isChecked ? 'De-select' : 'Select'} item ${label[0]}`}
      size="md"
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
