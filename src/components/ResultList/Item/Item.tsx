import { IDocsEntity } from '@api';
import { Flex, Link, Text, Stack, Box } from '@chakra-ui/layout';
import { Checkbox } from '@chakra-ui/checkbox';
import { getFomattedNumericPubdate, isBrowser } from '@utils';
import { useMachine } from '@xstate/react';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { ReactElement } from 'react';
import { IAbstractPreviewProps } from './AbstractPreview';
import { ItemResourceDropdowns } from './ItemResourceDropdowns';
import { itemMachine, ItemMachine } from './machine/item';

const AbstractPreview = dynamic<IAbstractPreviewProps>(
  () => import('./AbstractPreview').then((mod) => mod.AbstractPreview),
  { ssr: false },
);
interface IItemProps {
  doc: IDocsEntity;
  index: number;
  hideCheckbox: boolean;
  hideActions: boolean;
  set?: boolean;
  clear?: boolean;
  onSet?: (check: boolean) => void;
  useNormCite?: boolean;
}

export const Item = (props: IItemProps): ReactElement => {
  const { doc, index, hideCheckbox = false, hideActions = false, set, clear, onSet, useNormCite } = props;
  const { bibcode, pubdate, title = ['Untitled'], author = [], id, bibstem = [], author_count } = doc;
  const [state, send] = useMachine(itemMachine.withContext({ id }));
  const formattedPubDate = getFomattedNumericPubdate(pubdate);
  const [formattedBibstem] = bibstem;

  if ((set && state.matches('unselected')) || (clear && state.matches('selected'))) {
    send({ type: ItemMachine.TransitionTypes.TOGGLE_SELECT });
  }

  const handleSelect = () => {
    state.matches('selected') ? onSet(false) : onSet(true);
    send({ type: ItemMachine.TransitionTypes.TOGGLE_SELECT });
  };

  const checkBgClass = clsx(
    state.matches('selected') ? 'bg-blue-600' : 'bg-gray-100',
    'flex items-center justify-center mr-3 px-2 rounded-bl-md rounded-tl-md',
  );

  // citations
  const cite = useNormCite ? (
    typeof doc.citation_count_norm === 'number' && doc.citation_count_norm > 0 ? (
      <NextLink href={`/abs/${bibcode}/citations`} passHref>
        <Link>
          <Text>cited(n): {doc.citation_count_norm}</Text>
        </Link>
      </NextLink>
    ) : null
  ) : typeof doc.citation_count === 'number' && doc.citation_count > 0 ? (
    <NextLink href={`/abs/${bibcode}/citations`} passHref>
      <Link>cited: {doc.citation_count}</Link>
    </NextLink>
  ) : null;

  return (
    <Flex
      direction="row"
      as="article"
      border="1px"
      borderColor="gray.50"
      mb={1}
      borderRadius="md"
      aria-labelledby={`result-${id}`}
    >
      <Flex direction="row" className={checkBgClass} m={0}>
        <Text color={state.matches('selected') ? 'white' : 'initial'} display={{ base: 'none', md: 'initial' }} mr={1}>
          {index}
        </Text>
        {hideCheckbox ? null : (
          <Checkbox
            name={`result-checkbox-${index}`}
            id={`result-checkbox-${index}`}
            onChange={handleSelect}
            isChecked={state.matches('selected')}
            aria-label={title[0]}
            size="md"
          />
        )}
      </Flex>
      <Stack direction="column" width="full" spacing={0} mx={3} mt={2}>
        <Flex justifyContent="space-between">
          <NextLink href={`/abs/${bibcode}`} passHref>
            <Link fontWeight="semibold">
              <span dangerouslySetInnerHTML={{ __html: title[0] }}></span>
            </Link>
          </NextLink>
          <Flex alignItems="start" ml={1}>
            {!isBrowser() || hideActions ? null : <ItemResourceDropdowns doc={doc} />}
          </Flex>
        </Flex>
        <Flex direction="column">
          {author.length > 0 && (
            <Box fontSize="sm">
              {author.slice(0, 10).join('; ')}
              {author_count > 10 && (
                <Text as="span" fontStyle="italic">
                  {' '}
                  and {author_count - 10} more
                </Text>
              )}
            </Box>
          )}
          <Text fontSize="xs" mt={0.5}>
            {formattedPubDate}
            {formattedPubDate && formattedBibstem ? <span className="px-2">·</span> : ''}
            {formattedBibstem}
            {cite && (formattedPubDate || formattedBibstem) ? <span className="px-2">·</span> : null}
            {cite}
          </Text>
          <AbstractPreview id={id} />
        </Flex>
      </Stack>
    </Flex>
  );
};
