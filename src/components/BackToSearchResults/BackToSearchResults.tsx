import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Button, ButtonProps } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { SimpleLink } from '@/components/SimpleLink';
import { isLibraryReturnTarget, useSearchReturnTo, UseSearchReturnToOptions } from '@/lib/useSearchReturnTo';

export interface IBackToSearchResultsProps extends UseSearchReturnToOptions {
  label?: string;
  /** Forwarded styling overrides (margins, alignment) for the host layout. */
  buttonProps?: ButtonProps;
}

/**
 * The single "back to search results" control. Resolves its target via
 * useSearchReturnTo and renders nothing when no target exists (e.g. a deep link
 * straight into an abstract), so callers never show a dead button.
 */
export const BackToSearchResults = ({
  label,
  buttonProps,
  ...options
}: IBackToSearchResultsProps): ReactElement | null => {
  const { returnTo } = useSearchReturnTo(options);

  if (!returnTo) {
    return null;
  }

  const resolvedLabel = label ?? (isLibraryReturnTarget(returnTo) ? 'Back to library' : 'Back to results');

  return (
    <Button
      as={SimpleLink}
      href={returnTo}
      variant="link"
      size="sm"
      leftIcon={<ChevronLeftIcon w={6} h={6} />}
      alignSelf="flex-start"
      data-testid="back-to-results"
      {...buttonProps}
    >
      {resolvedLabel}
    </Button>
  );
};
