import { Center, MenuItem, MenuItemProps, Spinner, ToastId, useToast } from '@chakra-ui/react';
import { useAddWorks } from '@/lib/orcid/useAddWorks';
import { AppState, useStore } from '@/store';
import React, { useCallback, useRef } from 'react';
import { TOAST_DEFAULTS } from '@/components/Orcid/helpers';
import { parseAPIError, pluralize } from '@/utils';
import { IOrcidResponse } from '@/api/orcid/types';
import { BulkClaimErrorDetails } from '@/components/Orcid/BulkDeleteMenuItem';

const selectedDocsSelector = (state: AppState) => state.docs.selected;

export const BulkClaimMenuItem = (props: MenuItemProps) => {
  const toast = useToast(TOAST_DEFAULTS);
  const mainToastIdRef = useRef<ToastId>();
  const { addWorks } = useAddWorks(
    {},
    {
      onError: (error, variables) => {
        toast.update(mainToastIdRef.current, {
          status: 'error',
          title: `Unable to claim ${pluralize('work', variables.works.length)}`,
          description: parseAPIError(error),
        });
      },
      onSettled: (data) => {
        const { rejected, skipped, entries } = processResponse(data);

        if (rejected.length > 0) {
          toast({
            status: 'warning',
            title: `Unable to claim ${rejected.length} ${pluralize('work', rejected.length)}`,
            description: <BulkClaimErrorDetails rejected={rejected} result={data} />,
            isClosable: true,
          });
          toast.close(mainToastIdRef.current);
        }

        if (rejected.length < entries.length) {
          const skippedMsg =
            skipped.length > 0
              ? `Skipped ${skipped.length} ${pluralize('work', skipped.length)} that have already been claimed`
              : null;
          toast.update(mainToastIdRef.current, {
            status: 'success',
            title: `Claimed ${entries.length - rejected.length - skipped.length} ${pluralize(
              'work',
              entries.length - rejected.length - skipped.length,
            )}`,
            description: skippedMsg,
            duration: 5000,
          });
        }
      },
    },
  );

  const selected = useStore(selectedDocsSelector);
  const handleClick = useCallback(() => {
    mainToastIdRef.current = toast({
      status: 'info',
      title: `Attempting to claim ${selected.length} ${pluralize('work', selected.length)} from SciX`,
      isClosable: true,
      description: (
        <Center>
          <Spinner />
        </Center>
      ),
      duration: 30 * 1000, // 30 seconds
    });

    if (selected.length > 100) {
      toast({
        status: 'warning',
        title: 'You can only claim 100 works at a time.',
        description: 'Only the first 100 will be submitted.',
      });
    }

    try {
      addWorks(selected.slice(0, 100));
    } catch (error) {
      toast.update(mainToastIdRef.current, {
        status: 'error',
        title: 'Unable to claim works',
        description: 'Please try again later.',
      });
    }
  }, [addWorks, selected]);

  return (
    <MenuItem onClick={handleClick} isDisabled={selected.length === 0} {...props}>
      Claim from SciX
    </MenuItem>
  );
};

/**
 * Process the response from the addWorks mutation
 * Breaks apart the response into rejected, skipped, and entries
 * @param data
 */
const processResponse = (data: IOrcidResponse['addWorks']) => {
  // fill rejected array with rejected works
  const rejected = [];
  const skipped = [];
  const entries = Object.entries(data);
  for (const [key, value] of entries) {
    if (value.status === 'rejected') {
      value.reason['response-code'] === 409 ? skipped.push(key) : rejected.push(key);
    }
  }
  return { rejected, skipped, entries };
};
