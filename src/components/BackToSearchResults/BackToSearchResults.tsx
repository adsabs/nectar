import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Button, ButtonProps } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { SimpleLink } from '@/components/SimpleLink';
import { useSearchReturnTo, UseSearchReturnToOptions } from '@/lib/useSearchReturnTo';

export interface IBackToSearchResultsProps extends UseSearchReturnToOptions {
  /** Visible label; defaults to the canonical "Back to results". */
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
  label = 'Back to results',
  buttonProps,
  ...options
}: IBackToSearchResultsProps): ReactElement | null => {
  const { returnTo } = useSearchReturnTo(options);

  if (!returnTo) {
    return null;
  }

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
      {label}
    </Button>
  );
};
