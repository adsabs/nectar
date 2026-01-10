import { Box, BoxProps } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { AllAuthorsModal } from './AllAuthorsModal';
import { IDocsEntity } from '@/api/search/types';

export interface AuthorListProps extends BoxProps {
  author: IDocsEntity['author'];
  authorCount: IDocsEntity['author_count'];
  bibcode: IDocsEntity['bibcode'];
  maxAuthors: number;
}

/**
 * Displays a truncated author list with a modal to view all authors.
 */
export function AuthorList(props: AuthorListProps): ReactElement | null {
  const { author, authorCount, bibcode, maxAuthors, ...boxProps } = props;

  if (authorCount === 0) {
    return null;
  }

  const showMoreLabel = authorCount > maxAuthors ? `and ${authorCount - maxAuthors} more` : 'show details';

  return (
    <Box fontSize="sm" {...boxProps}>
      {author.slice(0, maxAuthors).join('; ')}
      {'; '}
      <AllAuthorsModal bibcode={bibcode} label={showMoreLabel} />
    </Box>
  );
}
