import {
  Box,
  BoxProps,
  Checkbox,
  CheckboxProps,
  Flex,
  IconButton,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { AllAuthorsModal } from '@/components/AllAuthorsModal';
import { ItemResourceDropdowns } from '@/components/ResultList/Item';
import { APP_DEFAULTS } from '@/config';

import { useIsClient } from '@/lib/useIsClient';
import { MathJax } from 'better-react-mathjax';
import { ChangeEvent, ReactElement } from 'react';
import { ItemAnnotation } from './ItemAnnotation';

import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { SimpleLink } from '@/components/SimpleLink/SimpleLink';
import { useColorModeColors } from '@/lib/useColorModeColors';

import { getFormattedNumericPubdate, unwrapStringValue } from '@/utils/common/formatters';
import { noop } from '@/utils/common/noop';
import { IDocsEntity } from '@/api/search/types';
import { LibraryIdentifier } from '@/api/biblib/types';

export interface IItemProps {
  doc: IDocsEntity;
  library: LibraryIdentifier;
  canEdit: boolean;
  showNote: boolean;
  note?: string;
  onNoteUpdate: () => void;
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
    library,
    canEdit,
    showNote,
    note = '',
    onNoteUpdate,
    index,
    hideCheckbox,
    isChecked = false,
    onSet = noop,
    useNormCite,
    hideResources = true,
  } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], author_count, pub } = doc;
  const formattedPubDate = getFormattedNumericPubdate(pubdate);
  const isClient = useIsClient();
  const colors = useColorModeColors();
  const truncatedPub =
    pub?.length > APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF ? pub.slice(0, APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF) + '...' : pub;

  // annotation / abstract
  const { isOpen, onClose, onOpen } = useDisclosure();

  // citations
  const cite = useNormCite ? (
    typeof doc.citation_count_norm === 'number' && doc.citation_count_norm > 0 ? (
      <SimpleLink
        href={{
          pathname: `/abs/${bibcode}/citations`,
          search: 'p=1',
        }}
      >
        <Text>cited(n): {doc.citation_count_norm.toFixed(2)}</Text>
      </SimpleLink>
    ) : null
  ) : typeof doc.citation_count === 'number' && doc.citation_count > 0 ? (
    <SimpleLink
      href={{
        pathname: `/abs/${bibcode}/citations`,
        search: 'p=1',
      }}
    >
      cited: {doc.citation_count}
    </SimpleLink>
  ) : null;

  return (
    <Flex direction="row" as="article" border="1px" borderColor={colors.border} mb={1} borderRadius="md">
      <Flex
        direction="row"
        backgroundColor={isChecked ? colors.panelHighlight : colors.panel}
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
          <SimpleLink href={`/abs/${bibcode}/abstract`} fontWeight="semibold">
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
          </SimpleLink>
          <Flex alignItems="start" ml={1}>
            <Tooltip label="Show annotation">
              <IconButton
                aria-label="Show annotation"
                icon={<PencilSquareIcon width="18px" height="18px" />}
                variant="link"
                size="xs"
                onClick={onOpen}
              />
            </Tooltip>
            {!isClient || hideResources ? null : <ItemResourceDropdowns doc={doc} />}
          </Flex>
        </Flex>
        <Flex direction="column">
          <AuthorList author={author} authorCount={author_count} bibcode={doc.bibcode} />
          <Text fontSize="xs" mt={0.5}>
            {formattedPubDate}
            {formattedPubDate && pub ? <span className="px-2">·</span> : ''}
            <Tooltip label={pub} aria-label="publication tooltip" placement="top">
              <span>{truncatedPub}</span>
            </Tooltip>
            {cite && (formattedPubDate || pub) ? <span className="px-2">·</span> : null}
            {cite}
          </Text>
          <ItemAnnotation
            library={library}
            bibcode={bibcode}
            note={note}
            onUpdate={onNoteUpdate}
            showNote={showNote}
            canEdit={canEdit}
            open={isOpen}
            onOpen={onOpen}
            onClose={onClose}
          />
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
      data-testid="document-checkbox"
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
