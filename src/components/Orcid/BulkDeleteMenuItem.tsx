import {
  Box,
  Button,
  Center,
  Collapse,
  MenuItem,
  MenuItemProps,
  Spinner,
  Text,
  ToastId,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { TOAST_DEFAULTS } from '@/components/Orcid/helpers';
import { useRemoveWorks } from '@/lib/orcid/useRemoveWorks';
import { AppState, useStore } from '@/store';
import React, { useCallback } from 'react';
import { IOrcidResponse } from '@/api/orcid/types';

import { pluralize } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { logger } from '@/logger';

const selectedDocsSelector = (state: AppState) => state.docs.selected;
export const BulkDeleteMenuItem = (props: MenuItemProps) => {
  const toast = useToast(TOAST_DEFAULTS);
  const mainToastIdRef = React.useRef<ToastId>();
  const { removeWorks } = useRemoveWorks({
    onError: (error, variables) => {
      toast.update(mainToastIdRef.current, {
        status: 'error',
        title: `Unable to delete ${pluralize('claim', variables.putcodes.length)}`,
        description: parseAPIError(error),
      });
    },
    onSettled: (data) => {
      const { rejected, entries } = processResponse(data);

      if (rejected.length < entries.length) {
        toast.update(mainToastIdRef.current, {
          status: 'success',
          title: `Deleted ${entries.length - rejected.length} ${pluralize('claim', entries.length - rejected.length)}`,
        });
      }

      if (rejected.length > 0) {
        toast({
          status: 'error',
          title: `Unable to delete ${rejected.length} ${pluralize('claim', rejected.length)}`,
          description: <BulkClaimErrorDetails result={data} rejected={rejected} />,
        });
        toast.close(mainToastIdRef.current);
      }
    },
  });

  const selected = useStore(selectedDocsSelector);
  const handleClick = useCallback(() => {
    mainToastIdRef.current = toast({
      status: 'info',
      title: `Attempting to delete ${selected.length} ${pluralize('claim', selected.length)} from SciX`,
      duration: 30 * 1000, // 30 seconds
      isClosable: true,
      description: (
        <Center>
          <Spinner />
        </Center>
      ),
    });

    try {
      removeWorks(selected);
    } catch (err) {
      logger.error({ err, selected }, 'Error deleting claim');
      toast.update(mainToastIdRef.current, {
        status: 'error',
        title: 'Unable to delete claims',
        description: 'Please try again later.',
      });
    }
  }, [removeWorks, selected, toast]);

  return (
    <MenuItem onClick={handleClick} isDisabled={selected.length === 0} {...props}>
      Delete claim from SciX
    </MenuItem>
  );
};

export const BulkClaimErrorDetails = <R extends IOrcidResponse['addWorks'] | IOrcidResponse['removeWorks']>(props: {
  result: R;
  rejected: string[];
}) => {
  const { isOpen, getButtonProps } = useDisclosure({ id: 'orcid-delete-claim-alert' });
  const { result, rejected } = props;

  return (
    <>
      <Collapse in={isOpen}>
        <Box maxHeight="200px" overflowY="scroll">
          {rejected.map((key) => {
            const item = result[key];
            return item.status === 'rejected' ? (
              <Text noOfLines={1} key={key}>
                {key} ({parseAPIError(item.reason)})
              </Text>
            ) : null;
          })}
        </Box>
      </Collapse>
      <Center mt={3}>
        <Button variant="link" colorScheme="white" {...getButtonProps()}>
          {isOpen ? 'Hide details' : 'View details'}
        </Button>
      </Center>
    </>
  );
};

/**
 * Process the response from the removeWorks mutation
 * Breaks apart the response into rejected and entries
 * @param data
 */
const processResponse = (data: IOrcidResponse['removeWorks']) => {
  // fill rejected array with rejected works
  const rejected = [];
  const entries = Object.entries(data);
  for (const [key, value] of entries) {
    if (value.status === 'rejected') {
      rejected.push(key);
    }
  }
  return { rejected, entries };
};
