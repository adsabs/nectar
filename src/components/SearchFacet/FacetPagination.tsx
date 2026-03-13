import { IconButton, IconButtonProps, Stack, Tooltip } from '@chakra-ui/react';
import { ArrowUpRightIcon } from '@heroicons/react/20/solid';
import { KeyboardEvent } from 'react';
import { noop } from '@/utils/common/noop';

export interface IFacetPaginationProps extends Omit<IconButtonProps, 'aria-label'> {
  show: boolean;
  pullRight?: boolean;
  label?: string;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

/**
 * Load-more button rendered at the bottom of a facet list.
 * Opens the full modal with search and pagination options.
 */
export const FacetPagination = (props: IFacetPaginationProps) => {
  const { show, pullRight, label = 'more', onArrowUp = noop, onArrowDown = noop, ...btnProps } = props;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp') {
      onArrowUp();
    } else if (e.key === 'ArrowDown') {
      onArrowDown();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <Tooltip label="Opens full list with search and filter options" placement="right">
      <Stack direction="row" justifyContent={pullRight ? 'end' : 'normal'}>
        <IconButton
          icon={<ArrowUpRightIcon width={20} />}
          size="xs"
          variant="outline"
          colorScheme="gray"
          opacity={0.7}
          type="button"
          borderRadius="md"
          aria-label={label}
          onKeyDown={handleKeyDown}
          data-testid="search-facet-load-more-btn"
          {...btnProps}
        />
      </Stack>
    </Tooltip>
  );
};
