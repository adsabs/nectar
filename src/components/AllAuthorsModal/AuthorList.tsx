import { Box, BoxProps, Flex } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { AllAuthorsModal } from './AllAuthorsModal';
import { IDocsEntity } from '@/api/search/types';

export interface AuthorListProps extends BoxProps {
  author: IDocsEntity['author'];
  authorCount: IDocsEntity['author_count'];
  bibcode: IDocsEntity['bibcode'];
  maxAuthors: number;
  clampLines?: number;
}

/**
 * Displays a truncated author list with a modal to view all authors.
 */
export function AuthorList(props: AuthorListProps): ReactElement | null {
  const { author, authorCount, bibcode, maxAuthors, clampLines, ...boxProps } = props;

  if (authorCount === 0) {
    return null;
  }

  const showMoreLabel = authorCount > maxAuthors ? `and ${authorCount - maxAuthors} more` : 'show details';
  const names = author.slice(0, maxAuthors).join('; ');

  if (typeof clampLines !== 'number') {
    return (
      <Box fontSize="sm" {...boxProps}>
        {names}
        {'; '}
        <AllAuthorsModal bibcode={bibcode} label={showMoreLabel} />
      </Box>
    );
  }

  return (
    <Flex fontSize="sm" alignItems="baseline" gap={1} minWidth={0} {...boxProps}>
      <Box as="span" noOfLines={clampLines} minWidth={0}>
        {names}
        {';'}
      </Box>
      <Box as="span" flexShrink={0}>
        <AllAuthorsModal bibcode={bibcode} label={showMoreLabel} />
      </Box>
    </Flex>
  );
}
